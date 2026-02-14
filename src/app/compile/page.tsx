"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/common/Header";
import CompilationProgress from "@/components/pipeline/CompilationProgress";
import DependencyGraph from "@/components/pipeline/DependencyGraph";
import AgentCards from "@/components/pipeline/AgentCards";
import DecisionQueueComponent from "@/components/pipeline/DecisionQueue";
import ExecutionPrompts from "@/components/pipeline/ExecutionPrompts";
import TokenBudgetDisplay from "@/components/pipeline/TokenBudget";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import Card, { CardHeader, CardTitle } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { useCompilation } from "@/hooks/useCompilation";
import { downloadAllExports } from "@/lib/export";
import { ArrowLeft, Download, GitBranch, Bot, MessageSquare, FileText, Coins } from "lucide-react";
import type { ModelTier, ProjectType } from "@/lib/types";
import { safeParseJSON } from "@/lib/utils/formatting";

type TabId = "dag" | "agents" | "decisions" | "prompts" | "tokens";

const TABS: { id: TabId; label: string; icon: typeof GitBranch }[] = [
  { id: "dag", label: "Dependency Graph", icon: GitBranch },
  { id: "agents", label: "Agent Roles", icon: Bot },
  { id: "decisions", label: "Decisions", icon: MessageSquare },
  { id: "prompts", label: "Prompts", icon: FileText },
  { id: "tokens", label: "Token Budget", icon: Coins },
];

export default function CompilePage() {
  const router = useRouter();
  const {
    isCompiling,
    stages,
    currentStageIndex,
    result,
    error,
    startCompilation,
  } = useCompilation();

  const [activeTab, setActiveTab] = useState<TabId>("dag");
  const hasStarted = useRef(false);

  // Start compilation on mount if we have a request in sessionStorage
  useEffect(() => {
    if (hasStarted.current) return;

    const stored = sessionStorage.getItem("gysom_compile_request");
    if (!stored) {
      router.push("/");
      return;
    }

    const data = safeParseJSON<{
      description: string;
      projectType: ProjectType;
      modelTier: ModelTier;
    }>(stored);

    if (data) {
      hasStarted.current = true;
      sessionStorage.removeItem("gysom_compile_request");
      startCompilation(data);
    }
    // Run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Header />
      <main className="mx-auto flex-1 max-w-6xl px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="mb-6 flex items-center gap-1 text-sm text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          New project
        </button>

        {/* Compilation in progress */}
        {isCompiling && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Spinner size="sm" />
                <CardTitle>Lacing up — hang tight</CardTitle>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Six stages, no dawdling. Your execution plan is being compiled right now.
              </p>
            </CardHeader>
            <CompilationProgress
              stages={stages}
              currentStageIndex={currentStageIndex}
            />
          </Card>
        )}

        {/* Error */}
        {error && !isCompiling && (
          <Card className="mb-8 border-red-800">
            <div className="text-center py-4">
              <p className="mb-1 text-sm font-medium text-red-400">Wiped out on the ice</p>
              <p className="mb-4 text-xs text-gray-500">{error}</p>
              <Button
                variant="secondary"
                onClick={() => router.push("/")}
              >
                Lace up and try again
              </Button>
            </div>
          </Card>
        )}

        {/* Results */}
        {result && !isCompiling && (
          <>
            {/* Result header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white">
                  {result.manifest.name}
                </h1>
                <p className="mt-1 text-sm text-gray-400">
                  {result.manifest.description}
                </p>
              </div>
              <Button
                variant="primary"
                onClick={() => downloadAllExports(result)}
              >
                <Download className="mr-2 h-4 w-4" />
                Grab Everything
              </Button>
            </div>

            {/* Tabs */}
            <div className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-800 pb-px">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-b-2 border-blue-500 text-blue-400"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <ErrorBoundary>
              {activeTab === "dag" && result.dag && (
                <DependencyGraph dag={result.dag} />
              )}
              {activeTab === "agents" && result.agents && (
                <AgentCards agents={result.agents} />
              )}
              {activeTab === "decisions" && result.decisionQueue && (
                <DecisionQueueComponent queue={result.decisionQueue} />
              )}
              {activeTab === "prompts" && result.prompts && (
                <ExecutionPrompts prompts={result.prompts} />
              )}
              {activeTab === "tokens" && result.tokenBudget && (
                <TokenBudgetDisplay budget={result.tokenBudget} />
              )}
            </ErrorBoundary>
          </>
        )}
      </main>
    </>
  );
}
