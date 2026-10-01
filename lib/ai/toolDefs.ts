import type Anthropic from "@anthropic-ai/sdk";
import { zodToJsonSchema } from "zod-to-json-schema";
import { StageSchemaMap, type StageSchemaKey } from "@/lib/schemas";

type Tool = Anthropic.Messages.Tool;

export function getToolForStage(stage: StageSchemaKey): Tool {
  return {
    name: `output_${stage}`,
    description: `Return the structured ${stage} output. All fields are required unless marked optional.`,
    input_schema: zodToJsonSchema(StageSchemaMap[stage]) as Tool["input_schema"],
  };
}