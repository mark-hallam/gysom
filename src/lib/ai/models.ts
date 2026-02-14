/**
 * Model configuration and routing for the GYSOM pipeline.
 */

import type { ModelTier, PipelineStageName } from "@/lib/types";
import {
  MODEL_IDS,
  BALANCED_STAGE_MODELS,
  FAST_STAGE_MODELS,
  MAXIMUM_STAGE_MODELS,
} from "@/lib/constants";

/** Map a ModelTier key to its Anthropic API model identifier */
export function getModelId(tier: ModelTier): string {
  return MODEL_IDS[tier];
}

/** Get the stage-to-model map for a given user-selected tier */
export function getStageModelMap(
  userTier: ModelTier
): Record<PipelineStageName, ModelTier> {
  switch (userTier) {
    case "sonnet45":
      return FAST_STAGE_MODELS;
    case "opus46":
      return MAXIMUM_STAGE_MODELS;
    case "opus45":
    default:
      return BALANCED_STAGE_MODELS;
  }
}

/** Select the correct model for a given pipeline stage and user tier */
export function selectModelForStage(
  stage: PipelineStageName,
  userTier: ModelTier
): string {
  const map = getStageModelMap(userTier);
  const tier = map[stage];
  return getModelId(tier);
}
