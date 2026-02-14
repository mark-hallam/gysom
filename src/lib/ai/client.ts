/**
 * Claude API client with model routing and streaming support.
 * All API calls use streaming internally to avoid Anthropic's timeout on long requests.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { ModelTier, PipelineStageName } from "@/lib/types";
import { selectModelForStage } from "./models";
import { SYSTEM_PROMPTS } from "./prompts";
import { MAX_OUTPUT_TOKENS_PER_STAGE, STAGE_OUTPUT_TOKEN_LIMITS } from "@/lib/constants";

interface ClientOptions {
  apiKey?: string;
  defaultTier?: ModelTier;
}

interface StreamCallbacks {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullText: string) => void;
}

interface MessageResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
}

/** Get the max output tokens for a given stage */
function getMaxTokensForStage(stage: PipelineStageName): number {
  return STAGE_OUTPUT_TOKEN_LIMITS[stage] || MAX_OUTPUT_TOKENS_PER_STAGE;
}

export class GysomAIClient {
  private client: Anthropic;
  private defaultTier: ModelTier;
  private cumulativeInputTokens = 0;
  private cumulativeOutputTokens = 0;

  constructor(options: ClientOptions = {}) {
    this.client = new Anthropic({
      apiKey: options.apiKey || process.env.ANTHROPIC_API_KEY,
      timeout: 5 * 60 * 1000, // 5 minutes per API call
    });
    this.defaultTier = options.defaultTier || "opus45";
  }

  /**
   * Send a message to Claude for a specific pipeline stage.
   * Automatically routes to the correct model based on stage and user tier.
   * Always uses streaming internally to avoid Anthropic API timeouts.
   */
  async runStage(
    stage: PipelineStageName,
    userMessage: string,
    tierOverride?: ModelTier,
    stream?: StreamCallbacks
  ): Promise<MessageResult> {
    const tier = tierOverride || this.defaultTier;
    const model = selectModelForStage(stage, tier);
    const systemPrompt = SYSTEM_PROMPTS[stage];
    const maxTokens = getMaxTokensForStage(stage);

    // Always use streaming to avoid Anthropic API timeout on long requests
    return this.streamMessage(model, systemPrompt, userMessage, maxTokens, stream || {});
  }

  /**
   * Streaming message — used for ALL API calls.
   * When no callbacks are provided, collects the full response silently.
   */
  private async streamMessage(
    model: string,
    system: string,
    userMessage: string,
    maxTokens: number,
    callbacks: StreamCallbacks
  ): Promise<MessageResult> {
    let fullText = "";
    let inputTokens = 0;
    let outputTokens = 0;

    const stream = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMessage }],
      stream: true,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        fullText += event.delta.text;
        callbacks.onChunk?.(event.delta.text);
      }
      if (event.type === "message_start" && event.message.usage) {
        inputTokens = event.message.usage.input_tokens;
      }
      if (event.type === "message_delta" && event.usage) {
        outputTokens = event.usage.output_tokens;
      }
    }

    callbacks.onComplete?.(fullText);

    this.cumulativeInputTokens += inputTokens;
    this.cumulativeOutputTokens += outputTokens;

    return { text: fullText, inputTokens, outputTokens };
  }

  /** Get cumulative token usage for the session */
  getTokenUsage(): { input: number; output: number } {
    return {
      input: this.cumulativeInputTokens,
      output: this.cumulativeOutputTokens,
    };
  }

  /** Reset token counters */
  resetTokenUsage(): void {
    this.cumulativeInputTokens = 0;
    this.cumulativeOutputTokens = 0;
  }
}

/** Create a new client instance (use per-request in API routes) */
export function createAIClient(options?: ClientOptions): GysomAIClient {
  return new GysomAIClient(options);
}
