import { z } from "zod";

export const EvalCaseCategory = z.enum(["positive", "negative", "edge", "adversarial"]);

export const EvalSchema = z.object({
  offlineCases: z
    .array(
      z.object({
        category: EvalCaseCategory,
        input: z.string().min(1),
        expected: z.string().min(1),
        notes: z.string().optional(),
      })
    )
    .min(4),
  onlineMetrics: z
    .array(
      z.object({
        metric: z.string().min(1),
        definition: z.string().min(4),
        target: z.string().min(1),
      })
    )
    .min(3),
  badCases: z
    .array(
      z.object({
        type: z.string().min(1),
        example: z.string().min(1),
        handling: z.string().min(4),
      })
    )
    .min(2),
  launchGates: z
    .array(
      z.object({
        metric: z.string().min(1),
        threshold: z.string().min(1),
        rationale: z.string().min(4),
      })
    )
    .min(2),
});

export type Eval = z.infer<typeof EvalSchema>;