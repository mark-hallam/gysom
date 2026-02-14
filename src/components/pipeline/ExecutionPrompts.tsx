"use client";

import { useState } from "react";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { Copy, Check, ChevronDown, ChevronRight } from "lucide-react";
import type { ExecutionPrompt } from "@/lib/types";

interface ExecutionPromptsProps {
  prompts: ExecutionPrompt[];
}

function PromptCard({ prompt }: { prompt: ExecutionPrompt }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(prompt.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader className="mb-0">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-left"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
            <CardTitle className="text-sm">
              {prompt.agentRole}
              <span className="ml-2 text-xs font-normal text-gray-500">
                Layer {prompt.layer}
              </span>
            </CardTitle>
          </button>
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            <span className="ml-1 text-xs">{copied ? "Copied" : "Copy"}</span>
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="mt-3">
          <pre className="max-h-80 overflow-auto rounded-lg bg-gray-950 p-4 text-xs text-gray-300">
            {prompt.prompt}
          </pre>

          {prompt.completionCriteria.length > 0 && (
            <div className="mt-3">
              <div className="mb-1 text-[10px] font-medium text-gray-500">
                Completion Criteria
              </div>
              <ul className="space-y-0.5 text-[10px] text-gray-400">
                {prompt.completionCriteria.map((c, i) => (
                  <li key={i}>- {c}</li>
                ))}
              </ul>
            </div>
          )}

          {prompt.expectedOutput && (
            <div className="mt-2 text-[10px] text-gray-500">
              <span className="font-medium">Expected output:</span>{" "}
              {prompt.expectedOutput}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function ExecutionPrompts({ prompts }: ExecutionPromptsProps) {
  const [allCopied, setAllCopied] = useState(false);

  async function handleCopyAll() {
    const allText = prompts
      .map(
        (p) =>
          `## ${p.agentRole} (Layer ${p.layer})\n\n${p.prompt}\n\n---`
      )
      .join("\n\n");
    await navigator.clipboard.writeText(allText);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">
          {prompts.length} Execution Prompts
        </h3>
        <Button variant="secondary" size="sm" onClick={handleCopyAll}>
          {allCopied ? (
            <Check className="mr-1 h-3 w-3 text-green-500" />
          ) : (
            <Copy className="mr-1 h-3 w-3" />
          )}
          {allCopied ? "All Copied" : "Copy All"}
        </Button>
      </div>

      {prompts.map((prompt) => (
        <PromptCard key={prompt.id} prompt={prompt} />
      ))}
    </div>
  );
}
