"use client";

import { useState } from "react";
import { Send, ChevronDown } from "lucide-react";
import Button from "@/components/ui/Button";
import type { ProjectType, ModelTier } from "@/lib/types";
import {
  MAX_INPUT_LENGTH,
  PROJECT_TYPE_LABELS,
  MODEL_TIER_INFO,
} from "@/lib/constants";

interface ProjectInputProps {
  onSubmit: (data: {
    description: string;
    projectType: ProjectType;
    modelTier: ModelTier;
  }) => void;
  isLoading: boolean;
}

const PROJECT_TYPES = Object.entries(PROJECT_TYPE_LABELS) as [
  ProjectType,
  string,
][];

const MODEL_TIERS: { key: ModelTier; info: (typeof MODEL_TIER_INFO)[ModelTier] }[] = [
  { key: "sonnet45", info: MODEL_TIER_INFO.sonnet45 },
  { key: "opus45", info: MODEL_TIER_INFO.opus45 },
  { key: "opus46", info: MODEL_TIER_INFO.opus46 },
];

export default function ProjectInput({ onSubmit, isLoading }: ProjectInputProps) {
  const [description, setDescription] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("SaaS");
  const [modelTier, setModelTier] = useState<ModelTier>("opus45");

  const charCount = description.length;
  const canSubmit = charCount >= 10 && charCount <= MAX_INPUT_LENGTH && !isLoading;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ description, projectType, modelTier });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-sm font-medium text-gray-300"
        >
          What are you building?
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Real-time collaboration app — video chat, shared whiteboard, project management. React + Node.js + PostgreSQL, 100 concurrent users per room. Include the tech stack, constraints, and scope — GYSOM handles the rest: fewer tokens, less hand-holding, agents that just go."
          maxLength={MAX_INPUT_LENGTH}
          rows={6}
          className="w-full resize-none rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-sm text-gray-100 placeholder-gray-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div className="mt-1 flex justify-between text-xs">
          <span className={charCount < 10 ? "text-yellow-500" : "text-gray-500"}>
            {charCount < 10 ? `${10 - charCount} more characters needed` : ""}
          </span>
          <span
            className={
              charCount > MAX_INPUT_LENGTH * 0.9
                ? "text-yellow-500"
                : "text-gray-500"
            }
          >
            {charCount.toLocaleString()} / {MAX_INPUT_LENGTH.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Project type
          </label>
          <div className="relative">
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value as ProjectType)}
              className="w-full appearance-none rounded-lg border border-gray-700 bg-gray-900 px-4 py-2.5 pr-10 text-sm text-gray-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {PROJECT_TYPES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Model tier
          </label>
          <div className="flex gap-2">
            {MODEL_TIERS.map(({ key, info }) => (
              <button
                key={key}
                type="button"
                onClick={() => setModelTier(key)}
                className={`flex-1 rounded-lg border px-3 py-2 text-center text-xs transition-colors ${
                  modelTier === key
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600"
                }`}
              >
                <div className="font-medium">{info.label}</div>
                <div className="mt-0.5 text-[10px] opacity-70">
                  {info.estimatedCost}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        isLoading={isLoading}
        disabled={!canSubmit}
        className="w-full"
      >
        <Send className="mr-2 h-4 w-4" />
        Get your skates on
      </Button>
    </form>
  );
}
