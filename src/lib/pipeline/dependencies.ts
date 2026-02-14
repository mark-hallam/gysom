/**
 * Stage 2: Dependency Analysis
 * Generates a DAG of task dependencies with layers and parallelism scoring.
 */

import type {
  DAG,
  DependencyNode,
  ProjectManifest,
  ModelTier,
  PipelineStageName,
} from "@/lib/types";
import { GysomAIClient } from "@/lib/ai/client";
import { extractJSON, safeParseJSON, repairTruncatedJSON } from "@/lib/utils/formatting";

const STAGE: PipelineStageName = "dependency-analysis";

interface DependencyResult {
  dag: DAG;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Analyze project dependencies and generate a DAG.
 * Takes the manifest from Stage 1 and produces a directed acyclic graph.
 */
export async function analyzeDependencies(
  client: GysomAIClient,
  manifest: ProjectManifest,
  modelTier?: ModelTier
): Promise<DependencyResult> {
  const userMessage = `Given this project manifest, generate a dependency graph (DAG) with execution layers:\n\n${JSON.stringify(manifest, null, 2)}`;

  const result = await client.runStage(STAGE, userMessage, modelTier);

  const jsonStr = extractJSON(result.text);
  let dag = safeParseJSON<DAG>(jsonStr);

  // If initial parse fails, try repairing truncated JSON
  if (!dag) {
    const repaired = repairTruncatedJSON(jsonStr);
    dag = safeParseJSON<DAG>(repaired);
  }

  if (!dag) {
    throw new Error(
      `Stage 2 (Dependency Analysis) failed: Could not parse response as DAG. Raw: ${result.text.slice(0, 200)}`
    );
  }

  // Validate DAG structure
  if (!dag.nodes || !Array.isArray(dag.nodes) || dag.nodes.length === 0) {
    throw new Error(
      "Stage 2 (Dependency Analysis) produced empty DAG: no nodes generated"
    );
  }

  if (!dag.edges) {
    dag.edges = [];
  }

  // Validate no circular dependencies (basic check)
  validateNoCycles(dag);

  // Compute layers if not provided
  if (!dag.layers || dag.layers.length === 0) {
    dag.layers = computeLayers(dag);
  }

  // Compute parallelism score if missing
  if (dag.parallelismScore === undefined) {
    const maxLayerSize = Math.max(...dag.layers.map((l) => l.length));
    dag.parallelismScore = maxLayerSize / dag.nodes.length;
  }

  // Compute critical path if missing
  if (!dag.criticalPath) {
    dag.criticalPath = {
      nodes: dag.layers.map((layer) => layer[0]?.id).filter(Boolean),
      estimatedTokens: dag.nodes.reduce(
        (sum, n) => sum + (n.estimatedTokens || 0),
        0
      ),
      estimatedDuration: `${dag.layers.length} phases`,
    };
  }

  dag.estimatedTotalTokens = dag.nodes.reduce(
    (sum, n) => sum + (n.estimatedTokens || 0),
    0
  );

  return {
    dag,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  };
}

/** Detect cycles using DFS */
function validateNoCycles(dag: DAG): void {
  const adjacency = new Map<string, string[]>();
  for (const edge of dag.edges) {
    const existing = adjacency.get(edge.source) || [];
    existing.push(edge.target);
    adjacency.set(edge.source, existing);
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    if (inStack.has(nodeId)) return true; // cycle found
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    inStack.add(nodeId);

    for (const neighbor of adjacency.get(nodeId) || []) {
      if (dfs(neighbor)) return true;
    }

    inStack.delete(nodeId);
    return false;
  }

  for (const node of dag.nodes) {
    if (dfs(node.id)) {
      throw new Error(
        `Stage 2 (Dependency Analysis) detected circular dependency involving node: ${node.id}`
      );
    }
  }
}

/** Compute execution layers using topological sort */
function computeLayers(dag: DAG): DependencyNode[][] {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  const nodeMap = new Map(dag.nodes.map((n) => [n.id, n]));

  for (const node of dag.nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  for (const edge of dag.edges) {
    adjacency.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  const layers: DependencyNode[][] = [];
  let current = dag.nodes
    .filter((n) => (inDegree.get(n.id) || 0) === 0)
    .map((n) => n.id);

  while (current.length > 0) {
    const layerNodes = current
      .map((id) => nodeMap.get(id))
      .filter((n): n is DependencyNode => n !== undefined);
    layers.push(layerNodes);

    const next: string[] = [];
    for (const nodeId of current) {
      for (const neighbor of adjacency.get(nodeId) || []) {
        const deg = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, deg);
        if (deg === 0) {
          next.push(neighbor);
        }
      }
    }
    current = next;
  }

  // Update layer numbers on nodes
  layers.forEach((layer, idx) => {
    for (const node of layer) {
      node.layer = idx;
    }
  });

  return layers;
}
