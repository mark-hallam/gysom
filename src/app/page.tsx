"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/common/Header";
import ProjectInput from "@/components/project/ProjectInput";
import Card from "@/components/ui/Card";
import { Zap, GitBranch, Users, FileText } from "lucide-react";
import type { ProjectType, ModelTier } from "@/lib/types";

const FEATURES = [
  {
    icon: Zap,
    title: "6-Stage Pipeline",
    description: "Intent extraction, dependency analysis, agent assignment, decision batching, prompt generation, execution planning.",
  },
  {
    icon: GitBranch,
    title: "DAG Visualization",
    description: "Interactive dependency graph showing parallel workstreams and critical path analysis.",
  },
  {
    icon: Users,
    title: "Agent-First",
    description: "Every output is optimized for autonomous agent execution, not human reading.",
  },
  {
    icon: FileText,
    title: "Ready-to-Execute",
    description: "Copy-paste CLAUDE.md, AGENTS.md, and per-agent prompts directly into your toolchain.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: {
    description: string;
    projectType: ProjectType;
    modelTier: ModelTier;
  }) {
    setIsLoading(true);
    setError(null);

    try {
      // Store the compilation request in sessionStorage so the compile page can pick it up
      sessionStorage.setItem("gysom_compile_request", JSON.stringify(data));
      router.push("/compile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-4 pt-16 pb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Compile your project into an
            <br />
            <span className="text-blue-500">agent-first execution plan</span>
          </h1>
          <p className="mx-auto mb-12 max-w-2xl text-lg text-gray-400">
            Describe your project in natural language. GYSOM transforms it into a
            DAG-based orchestration plan with agent roles, execution prompts, and
            parallel workstreams.
          </p>

          {/* Input form */}
          <div className="mx-auto max-w-2xl">
            <Card className="text-left">
              <ProjectInput onSubmit={handleSubmit} isLoading={isLoading} />
              {error && (
                <p className="mt-4 text-sm text-red-400">{error}</p>
              )}
            </Card>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <Card key={feature.title} className="text-center">
                <feature.icon className="mx-auto mb-3 h-8 w-8 text-blue-500" />
                <h3 className="mb-2 text-sm font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="text-xs text-gray-400">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-6 text-center text-xs text-gray-500">
        GYSOM — Get Your Skates On Mate
      </footer>
    </>
  );
}
