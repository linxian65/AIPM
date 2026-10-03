import { anthropic, MODEL } from "@/lib/anthropic";
import { StageSchemaMap, type StageSchemaKey } from "@/lib/schemas";
import { getToolForStage } from "./toolDefs";
import { buildFallback } from "./fallback";
import { getPromptForStage } from "@/lib/prompts";
import { normalizeToolInput } from "./normalizeToolInput";

export type RunStageResult<T = unknown> =
  | { ok: true; data: T; raw: unknown; usage: { input: number; output: number } }
  | { ok: false; error: string; raw?: unknown; fallback: T };

type RunStageInput = {
  stage: StageSchemaKey;
  brief: string;
  previousOutputs?: Record<string, unknown>;
};

const MAX_BIZ_RETRIES = 1;

export async function runStage<T = unknown>(
  input: RunStageInput
): Promise<RunStageResult<T>> {
  const { stage, brief, previousOutputs } = input;
  const schema = StageSchemaMap[stage];
  const tool = getToolForStage(stage);
  const systemPrompt = getPromptForStage(stage, brief, previousOutputs);

  let lastError: { error: string; raw?: unknown } | null = null;

  for (let attempt = 0; attempt <= MAX_BIZ_RETRIES; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 16384,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{ role: "user", content: `Generate the ${stage} output.` }],
        tools: [tool],
        tool_choice: { type: "auto" },
      });

      if (response.stop_reason === "max_tokens") {
        lastError = { error: "TRUNCATED_BY_MAX_TOKENS", raw: response };
        console.warn(`[runStage] ${stage} truncated, attempt ${attempt + 1}`);
        continue;
      }

      const toolUseBlock = response.content.find(
        (block) => block.type === "tool_use"
      );

      if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
        return {
          ok: false,
          error: "MODEL_DID_NOT_RETURN_TOOL_USE",
          raw: response,
          fallback: buildFallback(stage) as T,
        };
      }

      const { input: normalizedInput, normalized, unmatched } =
        normalizeToolInput(stage, toolUseBlock.input);
      if (normalized > 0) {
        console.warn(
          `[runStage] ${stage} normalized ${normalized} items before validation`
        );
      }
      if (unmatched.length > 0) {
        console.warn(
          `[runStage] ${stage} unmatched shape(s) after normalize`,
          unmatched.slice(0, 3)
        );
      }

      const parsed = schema.safeParse(normalizedInput);
      if (!parsed.success) {
        lastError = {
          error: `VALIDATION_FAILED: ${parsed.error.message}`,
          raw: toolUseBlock.input,
        };
        console.warn(
          `[runStage] ${stage} validation failed, attempt ${attempt + 1}`,
          parsed.error.flatten()
        );
        continue;
      }

      return {
        ok: true,
        data: parsed.data as T,
        raw: toolUseBlock.input,
        usage: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
        },
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      lastError = { error: `API_ERROR: ${message}` };
      console.warn(
        `[runStage] ${stage} API error, attempt ${attempt + 1}`,
        message
      );
    }
  }

  console.error(`[runStage] ${stage} exhausted retries`, lastError);
  return {
    ok: false,
    error: lastError?.error ?? "UNKNOWN",
    raw: lastError?.raw,
    fallback: buildFallback(stage) as T,
  };
}
