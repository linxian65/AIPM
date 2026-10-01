import { z } from "zod";

export const FeatureSchema = z.object({
  name: z.string().min(1),
  oneLiner: z.string().min(4),
  inputs: z.array(z.string()).min(1),
  outputs: z.array(z.string()).min(1),
  successCriteria: z.array(z.string()).min(1),
  nonGoals: z.array(z.string()).min(1),
});

export type Feature = z.infer<typeof FeatureSchema>;