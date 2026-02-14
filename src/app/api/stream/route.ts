import { NextRequest } from "next/server";
import { compileRequestSchema } from "@/lib/utils/validators";
import { runPipeline } from "@/lib/pipeline";
import {
  formatSSE,
  errorEvent,
  completeEvent,
} from "@/lib/ai/streaming";
import type { StreamEvent } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = compileRequestSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        formatSSE(errorEvent("Validation failed: " + JSON.stringify(parsed.error.format()))),
        {
          status: 400,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        }
      );
    }

    const { description, modelTier } = parsed.data;
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const { plan } = await runPipeline({
            rawInput: description,
            modelTier,
            apiKey: process.env.ANTHROPIC_API_KEY,
            onProgress: (event: StreamEvent) => {
              controller.enqueue(encoder.encode(formatSSE(event)));
            },
          });

          controller.enqueue(
            encoder.encode(
              formatSSE(completeEvent(JSON.stringify({
                manifest: plan.manifest,
                dag: plan.dag,
                agents: plan.agents,
                assignments: plan.assignments,
                decisionQueue: plan.decisionQueue,
                prompts: plan.prompts,
                tokenBudget: plan.tokenBudget,
                layers: plan.layers,
              })))
            )
          );
          controller.close();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Pipeline failed";
          controller.enqueue(encoder.encode(formatSSE(errorEvent(message))));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Stream setup failed";
    return new Response(formatSSE(errorEvent(message)), {
      status: 500,
      headers: { "Content-Type": "text/event-stream" },
    });
  }
}
