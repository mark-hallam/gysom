/**
 * Export system: generates downloadable CLAUDE.md, AGENTS.md, and prompt files.
 */

import type { ExecutionPlan, ExportedContent, ExportOptions } from "@/lib/types";
import { renderTemplate, getTemplateForType } from "@/lib/templates";

/** Generate all exportable content from an execution plan */
export function generateExport(
  plan: ExecutionPlan,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  options?: ExportOptions
): ExportedContent {
  const template = getTemplateForType(plan.manifest.projectType);

  const claudeMd = renderTemplate(template.claudeMdTemplate, plan.manifest);
  const agentsMd = renderTemplate(template.agentsMdTemplate, plan.manifest);

  const executeJson: Record<string, (typeof plan.prompts)[0]> = {};
  for (const prompt of plan.prompts) {
    executeJson[prompt.agentRole] = prompt;
  }

  const summary = [
    `# ${plan.manifest.name} — Execution Summary`,
    "",
    `**Type**: ${plan.manifest.projectType}`,
    `**Complexity**: ${plan.manifest.complexityScore}/10`,
    `**Agents**: ${plan.agents.length}`,
    `**Layers**: ${plan.layers.length}`,
    `**Estimated Tokens**: ${plan.tokenBudget.totalEstimate.toLocaleString()}`,
    "",
    "## Agent Roles",
    ...plan.agents.map(
      (a) => `- **${a.name}** (${a.model}) — ${a.expertise.join(", ")}`
    ),
    "",
    "## Decision Points",
    ...plan.decisionQueue.decisions.map(
      (d) => `- [${d.urgency}] ${d.question}`
    ),
  ].join("\n");

  return { claudeMd, agentsMd, executeJson, summary };
}

/** Create a downloadable blob from text content */
export function createDownloadBlob(
  content: string,
  mimeType = "text/markdown"
): Blob {
  return new Blob([content], { type: mimeType });
}

/** Trigger a file download in the browser */
export function downloadFile(
  content: string,
  filename: string,
  mimeType = "text/markdown"
): void {
  const blob = createDownloadBlob(content, mimeType);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Download all exports as individual files */
export function downloadAllExports(plan: ExecutionPlan): void {
  const exported = generateExport(plan);

  downloadFile(exported.claudeMd, "CLAUDE.md");

  setTimeout(() => {
    downloadFile(exported.agentsMd, "AGENTS.md");
  }, 200);

  setTimeout(() => {
    downloadFile(exported.summary, "SUMMARY.md");
  }, 400);

  setTimeout(() => {
    downloadFile(
      JSON.stringify(exported.executeJson, null, 2),
      "execution-prompts.json",
      "application/json"
    );
  }, 600);
}
