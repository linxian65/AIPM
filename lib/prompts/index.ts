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
  const context = previousOutputs
    ? `已有产物：\n${JSON.stringify(previousOutputs, null, 2)}\n\n`
    : "";

  switch (stage) {
    case "clarify":
      return clarifyPrompt(brief);
    case "feature":
      return featurePrompt(brief, context);
    case "solution":
      return solutionPrompt(brief, context);
    case "eval":
      return evalPrompt(brief, context);
    case "redteam":
      return redteamPrompt(brief, context);
  }
}
