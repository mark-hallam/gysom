/**
 * Stage 1: Intent Extraction
 * Parses raw user input to extract project goals, constraints, and structure.
 */

import type { ProjectManifest, ModelTier, PipelineStageName } from "@/lib/types";
import { GysomAIClient } from "@/lib/ai/client";
import { extractJSON, safeParseJSON } from "@/lib/utils/formatting";

const STAGE: PipelineStageName = "intent-extraction";

interface IntentResult {
  manifest: ProjectManifest;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Extract project intent from raw user description.
 * Calls Claude to analyze the description and produce a structured ProjectManifest.
 */
export async function extractIntent(
  client: GysomAIClient,
  rawInput: string,
  modelTier?: ModelTier
): Promise<IntentResult> {
  const userMessage = `Analyze this project description and extract structured project intent:\n\n${rawInput}`;

  const result = await client.runStage(STAGE, userMessage, modelTier);

  const jsonStr = extractJSON(result.text);
  const manifest = safeParseJSON<ProjectManifest>(jsonStr);

  if (!manifest) {
    throw new Error(
      `Stage 1 (Intent Extraction) failed: Could not parse response as ProjectManifest. Raw: ${result.text.slice(0, 200)}`
    );
  }

  // Validate required fields
  if (!manifest.name || !manifest.goals || !Array.isArray(manifest.goals)) {
    throw new Error(
      "Stage 1 (Intent Extraction) produced incomplete manifest: missing name or goals"
    );
  }

  // Apply defaults for optional fields
  manifest.complexityScore = manifest.complexityScore || 5;
  manifest.estimatedAgents = manifest.estimatedAgents || 6;
  manifest.estimatedTokens = manifest.estimatedTokens || 20000;
  manifest.projectType = manifest.projectType || "SaaS";
  manifest.techStack = manifest.techStack || [];
  manifest.constraints = manifest.constraints || [];

  return {
    manifest,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  };
}
