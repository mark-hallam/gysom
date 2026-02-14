/**
 * Zod schemas for API input validation.
 */

import { z } from "zod/v4";
import { MAX_INPUT_LENGTH } from "@/lib/constants";

export const projectTypeSchema = z.enum([
  "SaaS",
  "ecommerce",
  "api",
  "mobile",
  "cli",
  "data_pipeline",
]);

export const modelTierSchema = z.enum(["opus46", "opus45", "sonnet45"]);

export const compileRequestSchema = z.object({
  description: z
    .string()
    .min(10, "Project description must be at least 10 characters")
    .max(MAX_INPUT_LENGTH, `Description cannot exceed ${MAX_INPUT_LENGTH} characters`),
  projectType: projectTypeSchema,
  modelTier: modelTierSchema.default("opus45"),
  maxTokens: z.number().positive().optional(),
});

export const decisionAnswerSchema = z.object({
  decisionId: z.string(),
  selectedOption: z.string(),
  reasoning: z.string().optional(),
});

export const projectCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  rawInput: z.string().min(10).max(MAX_INPUT_LENGTH),
});

export type CompileRequestInput = z.infer<typeof compileRequestSchema>;
export type DecisionAnswerInput = z.infer<typeof decisionAnswerSchema>;
export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
