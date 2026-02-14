/**
 * Pipeline Orchestrator
 * Runs the 6-stage compilation pipeline sequentially, tracking progress and tokens.
 */

import type {
  ExecutionPlan,
  ModelTier,
  PipelineStage,
  PipelineStageName,
  CompilationSession,
  StreamEvent,
} from "@/lib/types";
import { createAIClient } from "@/lib/ai/client";
import { getStageModelMap } from "@/lib/ai/models";
import { extractIntent } from "./intent";
import { analyzeDependencies } from "./dependencies";
import { assignAgents } from "./agents";
import { identifyHumanInput } from "./humanInput";
import { generatePrompts } from "./prompts";
import { assembleExecutionPlan } from "./execution";
import {
  validateManifest,
  validateDAG,
  validateAgents,
  validateDecisions,
  validatePrompts,
} from "./validation";
import { STAGE_DISPLAY_NAMES, PIPELINE_STAGE_COUNT } from "@/lib/constants";

const STAGE_ORDER: PipelineStageName[] = [
  "intent-extraction",
  "dependency-analysis",
  "agent-assignment",
  "human-decision-id",
  "prompt-generation",
  "execution-plan",
];

interface CompileOptions {
  rawInput: string;
  modelTier?: ModelTier;
  apiKey?: string;
  onProgress?: (event: StreamEvent) => void;
}

interface CompileResult {
  plan: ExecutionPlan;
  session: CompilationSession;
}

/**
 * Run the full 6-stage compilation pipeline.
 */
export async function runPipeline(
  options: CompileOptions
): Promise<CompileResult> {
  const { rawInput, modelTier = "opus45", apiKey, onProgress } = options;

  const client = createAIClient({ apiKey, defaultTier: modelTier });
  const stageModels = getStageModelMap(modelTier);

  const stages: PipelineStage[] = STAGE_ORDER.map((name, i) => ({
    name,
    number: i + 1,
    status: "pending",
    inputType: "json",
    outputType: "json",
    model: stageModels[name],
  }));

  const session: CompilationSession = {
    projectId: "",
    stages,
    currentStage: "intent-extraction",
    progress: 0,
    startTime: Date.now(),
  };

  function emitProgress(
    stage: PipelineStageName,
    type: StreamEvent["type"],
    data: string
  ) {
    const stageIdx = STAGE_ORDER.indexOf(stage);
    const progress = Math.round(((stageIdx + 1) / PIPELINE_STAGE_COUNT) * 100);
    session.progress = progress;
    session.currentStage = stage;

    onProgress?.({
      type,
      stage,
      data,
      progress,
      timestamp: Date.now(),
    });
  }

  function markStage(idx: number, status: PipelineStage["status"]) {
    stages[idx].status = status;
  }

  try {
    // Stage 1: Intent Extraction
    emitProgress("intent-extraction", "stage_start", STAGE_DISPLAY_NAMES["intent-extraction"]);
    markStage(0, "running");
    const { manifest } = await extractIntent(client, rawInput, stageModels["intent-extraction"]);
    const manifestErrors = validateManifest(manifest);
    if (manifestErrors.length) {
      throw new Error(`Validation failed: ${manifestErrors.map((e) => e.message).join(", ")}`);
    }
    markStage(0, "completed");
    emitProgress("intent-extraction", "stage_complete", JSON.stringify(manifest));

    // Stage 2: Dependency Analysis
    emitProgress("dependency-analysis", "stage_start", STAGE_DISPLAY_NAMES["dependency-analysis"]);
    markStage(1, "running");
    const { dag } = await analyzeDependencies(client, manifest, stageModels["dependency-analysis"]);
    const dagErrors = validateDAG(dag);
    if (dagErrors.length) {
      throw new Error(`Validation failed: ${dagErrors.map((e) => e.message).join(", ")}`);
    }
    markStage(1, "completed");
    emitProgress("dependency-analysis", "stage_complete", JSON.stringify({ nodeCount: dag.nodes.length, edgeCount: dag.edges.length }));

    // Stage 3: Agent Assignment
    emitProgress("agent-assignment", "stage_start", STAGE_DISPLAY_NAMES["agent-assignment"]);
    markStage(2, "running");
    const { agents, assignments } = await assignAgents(client, manifest, dag, stageModels["agent-assignment"]);
    const agentErrors = validateAgents(agents, assignments);
    if (agentErrors.length) {
      throw new Error(`Validation failed: ${agentErrors.map((e) => e.message).join(", ")}`);
    }
    markStage(2, "completed");
    emitProgress("agent-assignment", "stage_complete", JSON.stringify({ agentCount: agents.length }));

    // Stage 4: Human Input Identification
    emitProgress("human-decision-id", "stage_start", STAGE_DISPLAY_NAMES["human-decision-id"]);
    markStage(3, "running");
    const { decisionQueue } = await identifyHumanInput(client, manifest, dag, agents, assignments, stageModels["human-decision-id"]);
    const decisionErrors = validateDecisions(decisionQueue);
    if (decisionErrors.length) {
      throw new Error(`Validation failed: ${decisionErrors.map((e) => e.message).join(", ")}`);
    }
    markStage(3, "completed");
    emitProgress("human-decision-id", "stage_complete", JSON.stringify({ decisionCount: decisionQueue.decisions.length }));

    // Stage 5: Prompt Generation
    emitProgress("prompt-generation", "stage_start", STAGE_DISPLAY_NAMES["prompt-generation"]);
    markStage(4, "running");
    const { prompts } = await generatePrompts(client, manifest, dag, agents, assignments, decisionQueue, stageModels["prompt-generation"]);
    const promptErrors = validatePrompts(prompts);
    if (promptErrors.length) {
      throw new Error(`Validation failed: ${promptErrors.map((e) => e.message).join(", ")}`);
    }
    markStage(4, "completed");
    emitProgress("prompt-generation", "stage_complete", JSON.stringify({ promptCount: prompts.length }));

    // Stage 6: Execution Plan
    emitProgress("execution-plan", "stage_start", STAGE_DISPLAY_NAMES["execution-plan"]);
    markStage(5, "running");
    const { plan } = await assembleExecutionPlan(client, manifest, dag, agents, assignments, decisionQueue, prompts, stageModels["execution-plan"]);
    markStage(5, "completed");
    emitProgress("execution-plan", "stage_complete", "Execution plan complete");

    session.endTime = Date.now();
    session.progress = 100;
    session.result = {
      id: crypto.randomUUID(),
      projectId: session.projectId,
      manifest: plan.manifest,
      dag: plan.dag,
      agentAssignments: plan.agents,
      decisionQueue: plan.decisionQueue,
      executionPrompts: plan.prompts,
      tokenBudget: plan.tokenBudget,
      status: "completed",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    onProgress?.({
      type: "complete",
      data: "Compilation complete",
      progress: 100,
      timestamp: Date.now(),
    });

    return { plan, session };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pipeline failed";
    session.error = message;
    session.endTime = Date.now();

    // Mark current running stage as failed
    const failedStage = stages.find((s) => s.status === "running");
    if (failedStage) {
      failedStage.status = "failed";
      failedStage.error = message;
    }

    onProgress?.({
      type: "error",
      data: message,
      progress: session.progress,
      timestamp: Date.now(),
    });

    throw error;
  }
}

export { extractIntent } from "./intent";
export { analyzeDependencies } from "./dependencies";
export { assignAgents } from "./agents";
export { identifyHumanInput } from "./humanInput";
export { generatePrompts } from "./prompts";
export { assembleExecutionPlan } from "./execution";
