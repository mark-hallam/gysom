"use client";

import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Coins, Cpu, Lightbulb } from "lucide-react";
import type { TokenBudget as TokenBudgetType } from "@/lib/types";
import { formatTokens, formatCost } from "@/lib/utils/formatting";
import { MODEL_TIER_INFO } from "@/lib/constants";

interface TokenBudgetProps {
  budget: TokenBudgetType;
}

export default function TokenBudgetDisplay({ budget }: TokenBudgetProps) {
  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-blue-500" />
            <CardTitle className="text-sm">Token Budget</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-3">
            <div>
              <div className="text-lg font-bold text-white">
                {formatTokens(budget.totalEstimate)}
              </div>
              <div className="text-[10px] text-gray-500">Total Estimated</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-400">
                {formatTokens(budget.totalAllocated)}
              </div>
              <div className="text-[10px] text-gray-500">Total Allocated</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-400">
                {formatCost(budget.totalAllocated * 0.00003)}
              </div>
              <div className="text-[10px] text-gray-500">Est. Cost</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* By Agent */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-purple-500" />
            <CardTitle className="text-sm">By Agent</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {budget.byAgent.map((agent) => (
              <div
                key={agent.agentId}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-gray-300">{agent.agentName}</span>
                  <span className="rounded bg-gray-800 px-1 py-0.5 text-[10px] text-gray-500">
                    {MODEL_TIER_INFO[agent.model]?.label || agent.model}
                  </span>
                </div>
                <span className="font-mono text-gray-400">
                  {formatTokens(agent.allocated)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Optimizations */}
      {budget.optimizationSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <CardTitle className="text-sm">Optimization Tips</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {budget.optimizationSuggestions.map((opt, i) => (
                <li key={i} className="text-xs text-gray-400">
                  <span className="text-gray-300">{opt.suggestion}</span>
                  <span className="ml-1 text-gray-500">
                    ({opt.impact}, {opt.difficulty})
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
