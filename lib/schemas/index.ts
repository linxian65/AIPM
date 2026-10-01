import { z } from "zod";
import { ClarifySchema } from "./clarify";
import { FeatureSchema } from "./feature";
import { SolutionSchema } from "./solution";
import { EvalSchema } from "./eval";
import { RedTeamSchema } from "./redteam";

export const StageContentSchema = z.discriminatedUnion("stage", [
  z.object({ stage: z.literal("clarify"), content: ClarifySchema }),
  z.object({ stage: z.literal("feature"), content: FeatureSchema }),
  z.object({ stage: z.literal("solution"), content: SolutionSchema }),
  z.object({ stage: z.literal("eval"), content: EvalSchema }),
  z.object({ stage: z.literal("redteam"), content: RedTeamSchema }),
]);

export type StageContent = z.infer<typeof StageContentSchema>;

export const StageSchemaMap = {
  clarify: ClarifySchema,
  feature: FeatureSchema,
  solution: SolutionSchema,
  eval: EvalSchema,
  redteam: RedTeamSchema,
} as const;

export type StageSchemaKey = keyof typeof StageSchemaMap;

export * from "./common";
export * from "./clarify";
export * from "./feature";
export * from "./solution";
export * from "./eval";
export * from "./redteam";