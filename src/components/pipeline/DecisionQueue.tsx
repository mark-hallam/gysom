"use client";

import { useState } from "react";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { AlertTriangle, CheckCircle } from "lucide-react";
import type { DecisionQueue as DecisionQueueType } from "@/lib/types";

interface DecisionQueueProps {
  queue: DecisionQueueType;
  onAnswer?: (decisionId: string, value: string) => void;
}

const urgencyStyles = {
  blocking: { border: "border-red-500/40", badge: "bg-red-500/20 text-red-400", icon: AlertTriangle },
  high: { border: "border-yellow-500/40", badge: "bg-yellow-500/20 text-yellow-400", icon: AlertTriangle },
  normal: { border: "border-gray-700", badge: "bg-gray-500/20 text-gray-400", icon: CheckCircle },
  optional: { border: "border-gray-800", badge: "bg-gray-700/20 text-gray-500", icon: CheckCircle },
};

export default function DecisionQueueComponent({ queue, onAnswer }: DecisionQueueProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(queue.answers || {});

  function handleSelect(decisionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [decisionId]: value }));
    onAnswer?.(decisionId, value);
  }

  return (
    <div className="space-y-4">
      {queue.decisions.map((decision) => {
        const style = urgencyStyles[decision.urgency];
        const selected = answers[decision.id] || decision.defaultOption;

        return (
          <Card key={decision.id} className={style.border}>
            <CardHeader className="mb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm">{decision.question}</CardTitle>
                <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium ${style.badge}`}>
                  {decision.urgency}
                </span>
              </div>
              {decision.description && (
                <p className="mt-1 text-xs text-gray-500">{decision.description}</p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {decision.options.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-xs transition-colors ${
                      selected === option.value
                        ? "border-blue-500 bg-blue-500/10 text-blue-300"
                        : "border-gray-800 text-gray-400 hover:border-gray-700"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`decision-${decision.id}`}
                      value={option.value}
                      checked={selected === option.value}
                      onChange={() => handleSelect(decision.id, option.value)}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-medium text-gray-200">
                        {option.label}
                        {option.value === decision.defaultOption && (
                          <span className="ml-1 text-[10px] text-gray-500">
                            (default)
                          </span>
                        )}
                      </div>
                      {option.description && (
                        <div className="mt-0.5 text-gray-500">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
