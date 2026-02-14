"use client";

import { useState, useCallback, useRef } from "react";
import type {
  ExecutionPlan,
  PipelineStage,
  PipelineStageName,
  StreamEvent,
  ModelTier,
  ProjectType,
} from "@/lib/types";
// Constants available if needed for display
// import { PIPELINE_STAGE_COUNT, STAGE_DISPLAY_NAMES } from "@/lib/constants";
import { safeParseJSON } from "@/lib/utils/formatting";

const STAGE_ORDER: PipelineStageName[] = [
  "intent-extraction",
  "dependency-analysis",
  "agent-assignment",
  "human-decision-id",
  "prompt-generation",
  "execution-plan",
];

interface CompilationState {
  isCompiling: boolean;
  stages: PipelineStage[];
  currentStageIndex: number;
  progress: number;
  result: ExecutionPlan | null;
  error: string | null;
}

function createInitialStages(): PipelineStage[] {
  return STAGE_ORDER.map((name, i) => ({
    name,
    number: i + 1,
    status: "pending",
    inputType: "json",
    outputType: "json",
    model: "opus45",
  }));
}

export function useCompilation() {
  const [state, setState] = useState<CompilationState>({
    isCompiling: false,
    stages: createInitialStages(),
    currentStageIndex: -1,
    progress: 0,
    result: null,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const startCompilation = useCallback(
    async (data: {
      description: string;
      projectType: ProjectType;
      modelTier: ModelTier;
    }) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({
        isCompiling: true,
        stages: createInitialStages(),
        currentStageIndex: 0,
        progress: 0,
        result: null,
        error: null,
      });

      try {
        const response = await fetch("/api/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Compilation failed: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const event = safeParseJSON<StreamEvent>(line.slice(6));
            if (!event) continue;

            handleStreamEvent(event);
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Compilation failed";
        setState((prev) => ({
          ...prev,
          isCompiling: false,
          error: message,
        }));
      }
    },
    []
  );

  function handleStreamEvent(event: StreamEvent) {
    switch (event.type) {
      case "stage_start": {
        const stageIdx = event.stage
          ? STAGE_ORDER.indexOf(event.stage)
          : -1;
        setState((prev) => {
          const stages = [...prev.stages];
          if (stageIdx >= 0) stages[stageIdx] = { ...stages[stageIdx], status: "running" };
          return {
            ...prev,
            stages,
            currentStageIndex: stageIdx,
            progress: event.progress,
          };
        });
        break;
      }
      case "stage_complete": {
        const stageIdx = event.stage
          ? STAGE_ORDER.indexOf(event.stage)
          : -1;
        setState((prev) => {
          const stages = [...prev.stages];
          if (stageIdx >= 0) stages[stageIdx] = { ...stages[stageIdx], status: "completed" };
          return {
            ...prev,
            stages,
            progress: event.progress,
          };
        });
        break;
      }
      case "complete": {
        const result = safeParseJSON<ExecutionPlan>(event.data);
        setState((prev) => ({
          ...prev,
          isCompiling: false,
          progress: 100,
          result,
        }));
        break;
      }
      case "error": {
        setState((prev) => ({
          ...prev,
          isCompiling: false,
          error: event.data,
        }));
        break;
      }
    }
  }

  const cancelCompilation = useCallback(() => {
    abortRef.current?.abort();
    setState((prev) => ({
      ...prev,
      isCompiling: false,
      error: "Compilation cancelled",
    }));
  }, []);

  return {
    ...state,
    startCompilation,
    cancelCompilation,
  };
}
