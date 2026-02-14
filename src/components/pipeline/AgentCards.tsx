"use client";

import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Bot, FileCode } from "lucide-react";
import type { AgentRole } from "@/lib/types";
import { MODEL_TIER_INFO } from "@/lib/constants";

interface AgentCardsProps {
  agents: AgentRole[];
}

const priorityColors = {
  critical: "border-red-500/40 bg-red-500/5",
  high: "border-yellow-500/40 bg-yellow-500/5",
  normal: "border-gray-700",
  low: "border-gray-800",
};

const priorityBadge = {
  critical: "bg-red-500/20 text-red-400",
  high: "bg-yellow-500/20 text-yellow-400",
  normal: "bg-gray-500/20 text-gray-400",
  low: "bg-gray-700/20 text-gray-500",
};

export default function AgentCards({ agents }: AgentCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => (
        <Card
          key={agent.id}
          className={`${priorityColors[agent.priority]}`}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-blue-500" />
                <CardTitle className="text-sm">{agent.name}</CardTitle>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityBadge[agent.priority]}`}
              >
                {agent.priority}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-gray-400">{agent.description}</p>

            {/* Model */}
            <div className="mb-2 text-xs text-gray-500">
              Model:{" "}
              <span className="text-gray-300">
                {MODEL_TIER_INFO[agent.model]?.label || agent.model}
              </span>
            </div>

            {/* Expertise tags */}
            {agent.expertise.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1">
                {agent.expertise.slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px] text-gray-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Owned files */}
            {agent.ownedFiles.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[10px] font-medium text-gray-500">
                  <FileCode className="h-3 w-3" />
                  Files owned
                </div>
                {agent.ownedFiles.slice(0, 3).map((file) => (
                  <div
                    key={file}
                    className="truncate text-[10px] font-mono text-gray-500"
                  >
                    {file}
                  </div>
                ))}
                {agent.ownedFiles.length > 3 && (
                  <div className="text-[10px] text-gray-600">
                    +{agent.ownedFiles.length - 3} more
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
