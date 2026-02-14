/**
 * Server-Sent Events (SSE) streaming helpers.
 */

import type { StreamEvent, PipelineStageName } from "@/lib/types";

/** Format a StreamEvent as an SSE message string */
export function formatSSE(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/** Create a stage_start event */
export function stageStartEvent(
  stage: PipelineStageName,
  progress: number
): StreamEvent {
  return {
    type: "stage_start",
    stage,
    data: `Starting ${stage}`,
    progress,
    timestamp: Date.now(),
  };
}

/** Create a stage_complete event */
export function stageCompleteEvent(
  stage: PipelineStageName,
  data: string,
  progress: number
): StreamEvent {
  return {
    type: "stage_complete",
    stage,
    data,
    progress,
    timestamp: Date.now(),
  };
}

/** Create a chunk event for partial streaming */
export function chunkEvent(
  stage: PipelineStageName,
  data: string,
  progress: number
): StreamEvent {
  return {
    type: "chunk",
    stage,
    data,
    progress,
    timestamp: Date.now(),
  };
}

/** Create an error event */
export function errorEvent(message: string): StreamEvent {
  return {
    type: "error",
    data: message,
    progress: -1,
    timestamp: Date.now(),
  };
}

/** Create a completion event */
export function completeEvent(data: string): StreamEvent {
  return {
    type: "complete",
    data,
    progress: 100,
    timestamp: Date.now(),
  };
}

/** Create a ReadableStream that emits SSE events from an async generator */
export function createSSEReadableStream(
  generator: AsyncGenerator<StreamEvent>
): ReadableStream {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const event of generator) {
          controller.enqueue(encoder.encode(formatSSE(event)));
        }
        controller.close();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown streaming error";
        controller.enqueue(encoder.encode(formatSSE(errorEvent(message))));
        controller.close();
      }
    },
  });
}
