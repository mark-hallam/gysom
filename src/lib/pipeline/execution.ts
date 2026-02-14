/**
 * Stage 6: Execution Plan Assembly
 * Synthesizes all upstream outputs into CLAUDE.md, AGENTS.md, and final execution plan.
 */

import type {
  ExecutionPlan,
  ProjectManifest,
  DAG,
  AgentRole,
  AgentAssignment,
  DecisionQueue,
  ExecutionPrompt,
  TokenBudget,
  ModelTier,
  PipelineStageName,
} from "@/lib/types";
import { GysomAIClient } from "@/lib/ai/client";
import { extractJSON, safeParseJSON } from "@/lib/utils/formatting";
import { renderTemplate, getTemplateForType } from "@/lib/templates";

const STAGE: PipelineStageName = "execution-plan";

interface ExecutionPlanResult {
  plan: ExecutionPlan;
  inputTokens: number;
  outputTokens: number;
}

interface Stage6Output {
  claudeMd: string;
  agentsMd: string;
  layers: string[][];
  tokenBudget: TokenBudget;
  summary: string;
  estimatedDuration: string;
}

/**
 * Assemble the final execution plan with CLAUDE.md and AGENTS.md.
 */
export async function assembleExecutionPlan(
  client: GysomAIClient,
  manifest: ProjectManifest,
  dag: DAG,
  agents: AgentRole[],
  assignments: AgentAssignment[],
  decisionQueue: DecisionQueue,
  prompts: ExecutionPrompt[],
  modelTier?: ModelTier
): Promise<ExecutionPlanResult> {
  const context = {
    manifest,
    dagStats: {
      nodeCount: dag.nodes.length,
      edgeCount: dag.edges.length,
      layerCount: dag.layers.length,
      parallelismScore: dag.parallelismScore,
      criticalPath: dag.criticalPath,
    },
    agents: agents.map((a) => ({
      id: a.id,
      name: a.name,
      model: a.model,
      priority: a.priority,
      estimatedTokens: a.estimatedTokens,
    })),
    promptCount: prompts.length,
    decisionCount: decisionQueue.decisions.length,
  };

  const userMessage = `Synthesize the final execution plan with token budget and timing:\n\n${JSON.stringify(context, null, 2)}`;

  const result = await client.runStage(STAGE, userMessage, modelTier);

  const jsonStr = extractJSON(result.text);
  const parsed = safeParseJSON<Stage6Output>(jsonStr);

  // Use template-rendered versions if Claude's output is incomplete
  const template = getTemplateForType(manifest.projectType);
  // claudeMd and agentsMd are available for the execution plan output
  const _claudeMd =
    parsed?.claudeMd || renderTemplate(template.claudeMdTemplate, manifest);
  const _agentsMd =
    parsed?.agentsMd || renderTemplate(template.agentsMdTemplate, manifest);
  void _claudeMd;
  void _agentsMd;

  // Group prompts into layers
  const promptLayers: ExecutionPrompt[][] = [];
  const maxLayer = Math.max(...prompts.map((p) => p.layer), 0);
  for (let i = 0; i <= maxLayer; i++) {
    promptLayers.push(prompts.filter((p) => p.layer === i));
  }

  // Build token budget
  const tokenBudget: TokenBudget = parsed?.tokenBudget || {
    totalEstimate: dag.estimatedTotalTokens,
    totalAllocated: dag.estimatedTotalTokens,
    byAgent: agents.map((a) => ({
      agentId: a.id,
      agentName: a.name,
      estimated: a.estimatedTokens,
      allocated: a.estimatedTokens,
      model: a.model,
    })),
    byStage: [
      { stage: "intent-extraction", estimated: 3500, allocated: 3500, model: "opus45" as ModelTier },
      { stage: "dependency-analysis", estimated: 6000, allocated: 6000, model: "opus45" as ModelTier },
      { stage: "agent-assignment", estimated: 9000, allocated: 9000, model: "opus45" as ModelTier },
      { stage: "human-decision-id", estimated: 4000, allocated: 4000, model: "sonnet45" as ModelTier },
      { stage: "prompt-generation", estimated: 15000, allocated: 15000, model: "sonnet45" as ModelTier },
      { stage: "execution-plan", estimated: 7000, allocated: 7000, model: "sonnet45" as ModelTier },
    ],
    modelDistribution: {
      opus46: agents.filter((a) => a.model === "opus46").length,
      opus45: agents.filter((a) => a.model === "opus45").length,
      sonnet45: agents.filter((a) => a.model === "sonnet45").length,
    },
    optimizationSuggestions: [
      {
        suggestion: "Enable prompt caching for system prompts",
        impact: "5-40% cost reduction",
        difficulty: "easy",
      },
      {
        suggestion: "Use structured JSON templates for agent outputs",
        impact: "3-5% token reduction",
        difficulty: "easy",
      },
    ],
  };

  const plan: ExecutionPlan = {
    manifest,
    dag,
    agents,
    assignments,
    decisionQueue,
    prompts,
    tokenBudget,
    layers: promptLayers,
  };

  return {
    plan,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  };
}
