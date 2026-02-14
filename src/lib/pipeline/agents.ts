/**
 * Stage 3: Agent Assignment
 * Assigns agent roles to DAG tasks, matching expertise to requirements.
 */

import type {
  AgentRole,
  AgentAssignment,
  DAG,
  ProjectManifest,
  ModelTier,
  PipelineStageName,
} from "@/lib/types";
import { GysomAIClient } from "@/lib/ai/client";
import { extractJSON, safeParseJSON, repairTruncatedJSON } from "@/lib/utils/formatting";
import { getTemplateForType } from "@/lib/templates";

const STAGE: PipelineStageName = "agent-assignment";

interface AgentAssignmentResult {
  agents: AgentRole[];
  assignments: AgentAssignment[];
  inputTokens: number;
  outputTokens: number;
}

/**
 * Assign agent roles to tasks in the dependency graph.
 * Uses template hints for the project type and Claude for custom matching.
 */
export async function assignAgents(
  client: GysomAIClient,
  manifest: ProjectManifest,
  dag: DAG,
  modelTier?: ModelTier
): Promise<AgentAssignmentResult> {
  // Include template hints for the project type
  const template = getTemplateForType(manifest.projectType);
  const templateHint = template
    ? `\nReference agent roles for ${manifest.projectType} projects:\n${JSON.stringify(template.agentRoles, null, 2)}`
    : "";

  const userMessage = `Given this project manifest and dependency graph, assign agent roles to tasks.${templateHint}\n\nManifest:\n${JSON.stringify(manifest, null, 2)}\n\nDAG:\n${JSON.stringify(dag, null, 2)}`;

  const result = await client.runStage(STAGE, userMessage, modelTier);

  const jsonStr = extractJSON(result.text);
  let parsed = safeParseJSON<{
    agents: AgentRole[];
    assignments: AgentAssignment[];
  }>(jsonStr);

  // If initial parse fails, try repairing truncated JSON
  if (!parsed) {
    const repaired = repairTruncatedJSON(jsonStr);
    parsed = safeParseJSON<{
      agents: AgentRole[];
      assignments: AgentAssignment[];
    }>(repaired);
  }

  if (!parsed || !parsed.agents || !Array.isArray(parsed.agents)) {
    throw new Error(
      `Stage 3 (Agent Assignment) failed: Could not parse response. Raw: ${result.text.slice(0, 200)}`
    );
  }

  // Validate agents have required fields
  for (const agent of parsed.agents) {
    if (!agent.id || !agent.name) {
      throw new Error(
        `Stage 3: Agent missing required fields (id, name): ${JSON.stringify(agent).slice(0, 100)}`
      );
    }
    // Apply defaults
    agent.model = agent.model || "opus45";
    agent.ownedFiles = agent.ownedFiles || [];
    agent.dependencies = agent.dependencies || [];
    agent.expertise = agent.expertise || [];
    agent.priority = agent.priority || "normal";
    agent.estimatedTokens = agent.estimatedTokens || 2000;
    agent.claudeMdSnippet = agent.claudeMdSnippet || "";
  }

  const assignments = parsed.assignments || [];

  return {
    agents: parsed.agents,
    assignments,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  };
}
