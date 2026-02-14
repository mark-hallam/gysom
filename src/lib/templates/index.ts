/**
 * Template library: project type templates with rendering.
 */

import type { ProjectManifest, ProjectType } from "@/lib/types";
import { TEMPLATE_DEFINITIONS } from "./templates";
import { formatTokens } from "@/lib/utils/formatting";

export { TEMPLATE_DEFINITIONS };

/** Get the template definition for a given project type */
export function getTemplateForType(projectType: ProjectType) {
  return TEMPLATE_DEFINITIONS[projectType];
}

/** Render a template string by substituting {{PLACEHOLDER}} values from a manifest */
export function renderTemplate(
  template: string,
  manifest: ProjectManifest
): string {
  let rendered = template;

  rendered = rendered.replace(/\{\{PROJECT_NAME\}\}/g, manifest.name);
  rendered = rendered.replace(
    /\{\{PROJECT_DESCRIPTION\}\}/g,
    manifest.description
  );
  rendered = rendered.replace(
    /\{\{GOALS\}\}/g,
    manifest.goals.map((g) => `- ${g}`).join("\n")
  );
  rendered = rendered.replace(
    /\{\{CONSTRAINTS\}\}/g,
    manifest.constraints.map((c) => `- ${c}`).join("\n")
  );
  rendered = rendered.replace(
    /\{\{COMPLEXITY_SCORE\}\}/g,
    manifest.complexityScore.toString()
  );
  rendered = rendered.replace(
    /\{\{AGENT_COUNT\}\}/g,
    manifest.estimatedAgents.toString()
  );
  rendered = rendered.replace(
    /\{\{TOKEN_ESTIMATE\}\}/g,
    formatTokens(manifest.estimatedTokens)
  );
  rendered = rendered.replace(
    /\{\{TECH_STACK\}\}/g,
    manifest.techStack.join(", ")
  );

  return rendered;
}

/** Get all available project type keys */
export function getAvailableProjectTypes(): ProjectType[] {
  return Object.keys(TEMPLATE_DEFINITIONS) as ProjectType[];
}
