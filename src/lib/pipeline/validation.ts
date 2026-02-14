/**
 * Cross-stage validation rules for the compilation pipeline.
 */

import type {
  ProjectManifest,
  DAG,
  AgentRole,
  AgentAssignment,
  DecisionQueue,
  ExecutionPrompt,
} from "@/lib/types";

interface ValidationError {
  stage: string;
  field: string;
  message: string;
}

/** Validate Stage 1 output */
export function validateManifest(manifest: ProjectManifest): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!manifest.name?.trim()) {
    errors.push({ stage: "intent-extraction", field: "name", message: "Project name is required" });
  }
  if (!manifest.goals?.length) {
    errors.push({ stage: "intent-extraction", field: "goals", message: "At least one goal is required" });
  }
  if (manifest.complexityScore < 1 || manifest.complexityScore > 10) {
    errors.push({ stage: "intent-extraction", field: "complexityScore", message: "Complexity score must be 1-10" });
  }

  return errors;
}

/** Validate Stage 2 output */
export function validateDAG(dag: DAG): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!dag.nodes?.length) {
    errors.push({ stage: "dependency-analysis", field: "nodes", message: "DAG must have at least one node" });
  }

  // Check for orphan nodes in edges
  const nodeIds = new Set(dag.nodes.map((n) => n.id));
  for (const edge of dag.edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push({ stage: "dependency-analysis", field: "edges", message: `Edge source "${edge.source}" not found in nodes` });
    }
    if (!nodeIds.has(edge.target)) {
      errors.push({ stage: "dependency-analysis", field: "edges", message: `Edge target "${edge.target}" not found in nodes` });
    }
  }

  return errors;
}

/** Validate Stage 3 output */
export function validateAgents(
  agents: AgentRole[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  assignments: AgentAssignment[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!agents?.length) {
    errors.push({ stage: "agent-assignment", field: "agents", message: "At least one agent is required" });
  }

  const agentIds = new Set(agents.map((a) => a.id));
  for (const agent of agents) {
    for (const dep of agent.dependencies) {
      if (!agentIds.has(dep)) {
        errors.push({ stage: "agent-assignment", field: "dependencies", message: `Agent "${agent.id}" depends on unknown agent "${dep}"` });
      }
    }
  }

  return errors;
}

/** Validate Stage 4 output */
export function validateDecisions(queue: DecisionQueue): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const decision of queue.decisions) {
    if (!decision.options?.length) {
      errors.push({ stage: "human-decision-id", field: `decision.${decision.id}`, message: `Decision "${decision.id}" has no options` });
    }
  }

  return errors;
}

/** Validate Stage 5 output */
export function validatePrompts(prompts: ExecutionPrompt[]): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const prompt of prompts) {
    if (!prompt.prompt?.trim()) {
      errors.push({ stage: "prompt-generation", field: `prompt.${prompt.id}`, message: `Prompt "${prompt.id}" has empty prompt text` });
    }
  }

  return errors;
}

/** Run all validations and return combined errors */
export function validateAll(data: {
  manifest?: ProjectManifest;
  dag?: DAG;
  agents?: AgentRole[];
  assignments?: AgentAssignment[];
  decisionQueue?: DecisionQueue;
  prompts?: ExecutionPrompt[];
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data.manifest) errors.push(...validateManifest(data.manifest));
  if (data.dag) errors.push(...validateDAG(data.dag));
  if (data.agents && data.assignments)
    errors.push(...validateAgents(data.agents, data.assignments));
  if (data.decisionQueue) errors.push(...validateDecisions(data.decisionQueue));
  if (data.prompts) errors.push(...validatePrompts(data.prompts));

  return errors;
}
