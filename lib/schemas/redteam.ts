import { z } from "zod";
import { SeveritySchema } from "./common";

export const RedTeamRole = z.enum(["algo", "eng", "design", "legal", "user"]);

export const RedTeamSchema = z.object({
  parties: z
    .array(
      z.object({
        role: RedTeamRole,
        concerns: z
          .array(
            z.object({
              concern: z.string().min(4),
              severity: SeveritySchema,
              evidence: z.string().min(4),
              fix: z.string().min(4),
            })
          )
          .min(1),
      })
    )
    .min(3),
  topRisks: z.array(z.string()).min(1),
  nextSteps: z.array(z.string()).min(1),
});

export type RedTeam = z.infer<typeof RedTeamSchema>;