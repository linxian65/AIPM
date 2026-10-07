import type { StageSchemaKey } from "@/lib/schemas";
import { clarifyPrompt } from "./clarify";
import { featurePrompt } from "./feature";
import { solutionPrompt } from "./solution";
import { evalPrompt } from "./eval";
import { redteamPrompt } from "./redteam";

export function getPromptForStage(
  stage: StageSchemaKey,
  brief: string,
  previousOutputs?: Record<string, unknown>,
  userFeedback?: unknown
): string {
  // 把 artifacts 和 userFeedback 拆开，让 LLM 明确知道哪些是 AI 产物、哪些是用户已确认的约束。
  // clarify 的 _feedback 已沉淀到 clarify.clarifiedConstraints，不再单独展示，
  // 避免下游模型把同一份信息算两遍 / 重新提炼。
  const artifacts: Record<string, unknown> = {};
  const upstreamFeedbacks: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(previousOutputs ?? {})) {
    if (k === "clarify_feedback") continue;
    if (k.endsWith("_feedback")) {
      upstreamFeedbacks[k.replace(/_feedback$/, "")] = v;
    } else {
      artifacts[k] = v;
    }
  }

  const parts: string[] = [];
  if (Object.keys(artifacts).length > 0) {
    parts.push(`上游产物（AI 生成）：\n${JSON.stringify(artifacts, null, 2)}`);
  }
  if (Object.keys(upstreamFeedbacks).length > 0) {
    parts.push(
      `上游用户反馈（必须采纳的约束）：\n${JSON.stringify(upstreamFeedbacks, null, 2)}`
    );
  }
  const context = parts.length > 0 ? parts.join("\n\n") + "\n\n" : "";
  const userInput = userFeedback
    ? `本轮用户输入：\n${JSON.stringify(userFeedback, null, 2)}\n\n`
    : "";

  switch (stage) {
    case "clarify":
      return clarifyPrompt(brief, userInput);
    case "feature":
      return featurePrompt(brief, context);
    case "solution":
      return solutionPrompt(brief, context, userInput);
    case "eval":
      return evalPrompt(brief, context);
    case "redteam":
      return redteamPrompt(brief, context);
  }
}
