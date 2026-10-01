import { z } from "zod";
import { ComplexitySchema } from "./common";

export const SolutionSchema = z.object({
  options: z
    .array(
      z.object({
        name: z.string().min(1),
        pros: z.array(z.string()).min(1),
        cons: z.array(z.string()).min(1),
        fit: z.string().min(4),
        complexity: ComplexitySchema,
      })
    )
    .min(2),
  recommendation: z.string().min(4),
});

export type Solution = z.infer<typeof SolutionSchema>;