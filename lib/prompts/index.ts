import type { StageSchemaKey } from "@/lib/schemas";
import { clarifyPrompt } from "./clarify";
import { featurePrompt } from "./feature";
import { solutionPrompt } from "./solution";
import { evalPrompt } from "./eval";
import { redteamPrompt } from "./redteam";

export function getPromptForStage(
  stage: StageSchemaKey,
  brief: string,
  previousOutputs?: Record<string, unknown>
): string {
  const base = `用户需求：${brief}\n\n`;
  const context = previousOutputs
    ? `已有产物：\n${JSON.stringify(previousOutputs, null, 2)}\n\n`
    : "";

  switch (stage) {
    case "clarify":
      return clarifyPrompt(base);
    case "feature":
      return featurePrompt(base, context);
    case "solution":
      return solutionPrompt(base, context);
    case "eval":
      return evalPrompt(base, context);
    case "redteam":
      return redteamPrompt(base, context);
  }
}