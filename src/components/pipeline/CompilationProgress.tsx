"use client";

import { CheckCircle, Circle, Loader2, XCircle } from "lucide-react";
import { STAGE_DISPLAY_NAMES } from "@/lib/constants";
import type { PipelineStage } from "@/lib/types";

interface CompilationProgressProps {
  stages: PipelineStage[];
  currentStageIndex: number;
}

const statusIcon = {
  pending: <Circle className="h-5 w-5 text-gray-600" />,
  running: <Loader2 className="h-5 w-5 animate-spin text-blue-500" />,
  completed: <CheckCircle className="h-5 w-5 text-green-500" />,
  failed: <XCircle className="h-5 w-5 text-red-500" />,
};

export default function CompilationProgress({
  stages,
  currentStageIndex,
}: CompilationProgressProps) {
  const progress = Math.round(
    ((currentStageIndex + 1) / stages.length) * 100
  );

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-800">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-400">{progress}%</span>
      </div>

      {/* Stage list */}
      <div className="space-y-2">
        {stages.map((stage, idx) => (
          <div
            key={stage.name}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              idx === currentStageIndex
                ? "bg-blue-500/10 text-blue-400"
                : stage.status === "completed"
                  ? "text-gray-400"
                  : "text-gray-600"
            }`}
          >
            {statusIcon[stage.status]}
            <span>
              Stage {stage.number}: {STAGE_DISPLAY_NAMES[stage.name]}
            </span>
            {stage.duration && (
              <span className="ml-auto text-xs text-gray-500">
                {(stage.duration / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
