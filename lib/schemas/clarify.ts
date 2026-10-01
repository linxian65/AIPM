import { z } from "zod";
import { PrioritySchema } from "./common";

export const ClarifySchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().min(4),
        rationale: z.string().min(4),
        priority: PrioritySchema,
      })
    )
    .min(8)
    .max(12),
});

export type Clarify = z.infer<typeof ClarifySchema>;