import { z } from "zod";

export const PrioritySchema = z.enum(["low", "medium", "high"]);
export const SeveritySchema = z.enum(["low", "medium", "high"]);
export const ComplexitySchema = z.enum(["low", "medium", "high"]);
export const StageEnum = z.enum(["clarify", "feature", "solution", "eval", "redteam"]);

export type Priority = z.infer<typeof PrioritySchema>;
export type Severity = z.infer<typeof SeveritySchema>;
export type StageName = z.infer<typeof StageEnum>;