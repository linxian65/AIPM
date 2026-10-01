import { anthropic, MODEL } from "@/lib/anthropic";
import { StageSchemaMap, type StageSchemaKey } from "@/lib/schemas";
import { getToolForStage } from "./toolDefs";
import { buildFallback } from "./fallback";
import { getPromptForStage } from "@/lib/prompts";

export type RunStageResult<T = unknown> =
  | { ok: true; data: T; raw: unknown; usage: { input: number; output: number } }
  | { ok: false; error: string; raw?: unknown; fallback: T };

type RunStageInput = {
  stage: StageSchemaKey;
  brief: string;
  previousOutputs?: Record<string, unknown>;
};

export async function runStage<T = unknown>(
  input: RunStageInput
): Promise<RunStageResult<T>> {
  const { stage, brief, previousOutputs } = input;
  const schema = StageSchemaMap[stage];
  const tool = getToolForStage(stage);
  const systemPrompt = getPromptForStage(stage, brief, previousOutputs);

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 4096,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{ role: "user", content: `Generate the ${stage} output.` }],
      tools: [tool],
      tool_choice: { type: "tool", name: tool.name },
    });

    // 从 tool_use 块提取 input
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

    // Zod 校验
    const parsed = schema.safeParse(toolUseBlock.input);
    if (!parsed.success) {
      console.error("[runStage] Zod validation failed", {
        stage,
        errors: parsed.error.flatten(),
        raw: toolUseBlock.input,
      });
      return {
        ok: false,
        error: `VALIDATION_FAILED: ${parsed.error.message}`,
        raw: toolUseBlock.input,
        fallback: buildFallback(stage) as T,
      };
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
    console.error("[runStage] API call failed", { stage, error: message });
    return {
      ok: false,
      error: `API_ERROR: ${message}`,
      fallback: buildFallback(stage) as T,
    };
  }
}