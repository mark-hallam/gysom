import { NextRequest, NextResponse } from "next/server";
import { compileRequestSchema } from "@/lib/utils/validators";
import { runPipeline } from "@/lib/pipeline";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = compileRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { description, modelTier } = parsed.data;

    const { plan, session } = await runPipeline({
      rawInput: description,
      modelTier,
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    return NextResponse.json({
      id: session.result?.id,
      result: {
        manifest: plan.manifest,
        dag: plan.dag,
        agents: plan.agents,
        assignments: plan.assignments,
        decisionQueue: plan.decisionQueue,
        prompts: plan.prompts,
        tokenBudget: plan.tokenBudget,
        layers: plan.layers,
      },
      session: {
        stages: session.stages,
        progress: session.progress,
        duration: session.endTime
          ? session.endTime - session.startTime
          : undefined,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Compilation failed";
    console.error("[/api/compile]", message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
