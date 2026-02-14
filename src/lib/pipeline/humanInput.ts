/**
 * Stage 4: Human Input Identification
 * Identifies decisions requiring human input and batches them into a questionnaire.
 */

import type {
  DecisionQueue,
  ProjectManifest,
  AgentRole,
  AgentAssignment,
  DAG,
  ModelTier,
  PipelineStageName,
} from "@/lib/types";
import { GysomAIClient } from "@/lib/ai/client";
import { extractJSON, safeParseJSON, repairTruncatedJSON } from "@/lib/utils/formatting";

const STAGE: PipelineStageName = "human-decision-id";

interface HumanInputResult {
  decisionQueue: DecisionQueue;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Identify human decision points from the project plan.
 * Produces a prioritized decision queue with defaults.
 */
export async function identifyHumanInput(
  client: GysomAIClient,
  manifest: ProjectManifest,
  dag: DAG,
  agents: AgentRole[],
  assignments: AgentAssignment[],
  modelTier?: ModelTier
): Promise<HumanInputResult> {
  const context = {
    manifest,
    dagSummary: {
      nodeCount: dag.nodes.length,
      edgeCount: dag.edges.length,
      layerCount: dag.layers.length,
      parallelismScore: dag.parallelismScore,
    },
    agents: agents.map((a) => ({
      id: a.id,
      name: a.name,
      expertise: a.expertise,
      priority: a.priority,
    })),
    assignmentCount: assignments.length,
  };

  const userMessage = `Given this project context, identify decisions requiring human input:\n\n${JSON.stringify(context, null, 2)}`;

  const result = await client.runStage(STAGE, userMessage, modelTier);

  const jsonStr = extractJSON(result.text);
  let parsed = safeParseJSON<DecisionQueue>(jsonStr);

  // If initial parse fails, try repairing truncated JSON
  if (!parsed) {
    const repaired = repairTruncatedJSON(jsonStr);
    parsed = safeParseJSON<DecisionQueue>(repaired);
  }

  if (!parsed || !parsed.decisions || !Array.isArray(parsed.decisions)) {
    throw new Error(
      `Stage 4 (Human Input ID) failed: Could not parse decision queue. Raw: ${result.text.slice(0, 200)}`
    );
  }

  // Ensure proper structure
  parsed.answeredCount = 0;
  parsed.totalCount = parsed.decisions.length;
  parsed.answers = parsed.answers || {};

  // Validate each decision has required fields
  for (const decision of parsed.decisions) {
    if (!decision.id || !decision.question) {
      throw new Error(
        `Stage 4: Decision missing id or question: ${JSON.stringify(decision).slice(0, 100)}`
      );
    }
    decision.options = decision.options || [];
    decision.urgency = decision.urgency || "normal";
    decision.blockingTasks = decision.blockingTasks || [];
    decision.category = decision.category || "configuration";
    decision.defaultOption = decision.defaultOption || decision.options[0]?.value || "";
  }

  return {
    decisionQueue: parsed,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  };
}
