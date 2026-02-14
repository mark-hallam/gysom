/**
 * Stage 5: Prompt Generation
 * Generates CLAUDE.md and per-agent execution prompts.
 */

import type {
  ExecutionPrompt,
  ProjectManifest,
  DAG,
  AgentRole,
  AgentAssignment,
  DecisionQueue,
  ModelTier,
  PipelineStageName,
} from "@/lib/types";
import { GysomAIClient } from "@/lib/ai/client";
import { extractJSON, safeParseJSON, repairTruncatedJSON } from "@/lib/utils/formatting";

const STAGE: PipelineStageName = "prompt-generation";

interface PromptGenResult {
  prompts: ExecutionPrompt[];
  inputTokens: number;
  outputTokens: number;
}

/**
 * Generate execution prompts for each agent.
 * Produces self-contained, copy-ready prompts with completion criteria.
 */
export async function generatePrompts(
  client: GysomAIClient,
  manifest: ProjectManifest,
  dag: DAG,
  agents: AgentRole[],
  assignments: AgentAssignment[],
  decisionQueue: DecisionQueue,
  modelTier?: ModelTier
): Promise<PromptGenResult> {
  const context = {
    manifest,
    dag: {
      nodes: dag.nodes.map((n) => ({
        id: n.id,
        label: n.label,
        layer: n.layer,
        type: n.type,
        agentRole: n.agentRole,
      })),
      edges: dag.edges,
      layers: dag.layers.map((layer) => layer.map((n) => n.id)),
    },
    agents: agents.map((a) => ({
      id: a.id,
      name: a.name,
      model: a.model,
      ownedFiles: a.ownedFiles,
      dependencies: a.dependencies,
      expertise: a.expertise,
    })),
    assignments: assignments.map((a) => ({
      roleId: a.roleId,
      taskCount: a.tasks.length,
      tasks: a.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        files: t.files,
      })),
    })),
    decisions: decisionQueue.decisions.map((d) => ({
      id: d.id,
      question: d.question,
      defaultOption: d.defaultOption,
      urgency: d.urgency,
    })),
  };

  const userMessage = `Generate execution prompts for each agent based on this project plan:\n\n${JSON.stringify(context, null, 2)}`;

  const result = await client.runStage(STAGE, userMessage, modelTier);

  const jsonStr = extractJSON(result.text);
  let parsed = safeParseJSON<{ prompts: ExecutionPrompt[] }>(jsonStr);

  // If initial parse fails, try repairing truncated JSON
  if (!parsed) {
    const repaired = repairTruncatedJSON(jsonStr);
    parsed = safeParseJSON<{ prompts: ExecutionPrompt[] }>(repaired);
  }

  if (!parsed || !parsed.prompts || !Array.isArray(parsed.prompts)) {
    throw new Error(
      `Stage 5 (Prompt Generation) failed: Could not parse prompts. Raw: ${result.text.slice(0, 200)}`
    );
  }

  // Validate each prompt
  for (const prompt of parsed.prompts) {
    if (!prompt.id || !prompt.prompt) {
      throw new Error(
        `Stage 5: Prompt missing id or prompt text: ${JSON.stringify(prompt).slice(0, 100)}`
      );
    }
    prompt.agentRole = prompt.agentRole || "unknown";
    prompt.layer = prompt.layer ?? 0;
    prompt.dependencies = prompt.dependencies || [];
    prompt.completionCriteria = prompt.completionCriteria || [];
    prompt.expectedOutput = prompt.expectedOutput || "";
    prompt.estimatedTokens = prompt.estimatedTokens || 1000;
  }

  return {
    prompts: parsed.prompts,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  };
}
