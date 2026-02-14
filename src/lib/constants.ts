/**
 * GYSOM project-wide constants.
 */

/** Maximum character length for project description input */
export const MAX_INPUT_LENGTH = 5000;

/** Maximum tokens per compilation request */
export const MAX_TOKENS_PER_REQUEST = 50000;

/** Free tier: compilations per day */
export const FREE_TIER_DAILY_LIMIT = 5;

/** Number of pipeline stages */
export const PIPELINE_STAGE_COUNT = 6;

/** Model identifiers for the Anthropic API */
export const MODEL_IDS = {
  opus46: "claude-opus-4-6",
  opus45: "claude-opus-4-1",
  sonnet45: "claude-sonnet-4-5-20250929",
} as const;

/** Default model tier for new compilations */
export const DEFAULT_MODEL_TIER = "opus45" as const;

/** Model routing: which model to use for each pipeline stage (BALANCED tier) */
export const BALANCED_STAGE_MODELS = {
  "intent-extraction": "opus45",
  "dependency-analysis": "opus45",
  "agent-assignment": "opus45",
  "human-decision-id": "sonnet45",
  "prompt-generation": "sonnet45",
  "execution-plan": "sonnet45",
} as const;

/** FAST tier: all Sonnet */
export const FAST_STAGE_MODELS = {
  "intent-extraction": "sonnet45",
  "dependency-analysis": "sonnet45",
  "agent-assignment": "sonnet45",
  "human-decision-id": "sonnet45",
  "prompt-generation": "sonnet45",
  "execution-plan": "sonnet45",
} as const;

/** MAXIMUM tier: Opus 4.6 for analysis, Opus 4.5 for generation */
export const MAXIMUM_STAGE_MODELS = {
  "intent-extraction": "opus46",
  "dependency-analysis": "opus46",
  "agent-assignment": "opus46",
  "human-decision-id": "opus45",
  "prompt-generation": "opus45",
  "execution-plan": "opus45",
} as const;

/** Pipeline stage display names */
export const STAGE_DISPLAY_NAMES = {
  "intent-extraction": "Intent Extraction",
  "dependency-analysis": "Dependency Analysis",
  "agent-assignment": "Agent Assignment",
  "human-decision-id": "Human Decision ID",
  "prompt-generation": "Prompt Generation",
  "execution-plan": "Execution Plan",
} as const;

/** Pipeline stage numbers (1-indexed) */
export const STAGE_NUMBERS = {
  "intent-extraction": 1,
  "dependency-analysis": 2,
  "agent-assignment": 3,
  "human-decision-id": 4,
  "prompt-generation": 5,
  "execution-plan": 6,
} as const;

/** Default max tokens (output) per stage */
export const MAX_OUTPUT_TOKENS_PER_STAGE = 16384;

/** Per-stage output token limits (larger stages get more room) */
export const STAGE_OUTPUT_TOKEN_LIMITS: Record<string, number> = {
  "intent-extraction": 4096,
  "dependency-analysis": 16384,
  "agent-assignment": 16384,
  "human-decision-id": 8192,
  "prompt-generation": 32768,
  "execution-plan": 16384,
} as const;

/** Project type display labels */
export const PROJECT_TYPE_LABELS = {
  SaaS: "SaaS Application",
  ecommerce: "E-commerce Platform",
  api: "REST API Service",
  mobile: "Mobile Application",
  cli: "Command Line Tool",
  data_pipeline: "Data Pipeline",
} as const;

/** Model tier display info */
export const MODEL_TIER_INFO = {
  sonnet45: {
    label: "Fast",
    description: "All Claude Sonnet 4.5",
    estimatedCost: "$0.35",
    estimatedLatency: "~10s",
  },
  opus45: {
    label: "Balanced",
    description: "Opus 4.5 + Sonnet 4.5",
    estimatedCost: "$0.68",
    estimatedLatency: "~15s",
  },
  opus46: {
    label: "Maximum",
    description: "Opus 4.6 + Opus 4.5",
    estimatedCost: "$0.97",
    estimatedLatency: "~20s",
  },
} as const;
