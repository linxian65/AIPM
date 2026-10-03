import Anthropic from "@anthropic-ai/sdk";
import { zodToJsonSchema } from "zod-to-json-schema";
import { StageSchemaMap, type StageSchemaKey } from "@/lib/schemas";

type Tool = Anthropic.Messages.Tool;
type JsonSchema = Record<string, unknown>;

function toStrictSchema(schema: unknown): unknown {
  if (schema === null || typeof schema !== "object") return schema;
  if (Array.isArray(schema)) return schema.map(toStrictSchema);

  const obj = { ...(schema as JsonSchema) };

  if (
    obj.type === "object" &&
    obj.properties &&
    typeof obj.properties === "object"
  ) {
    obj.additionalProperties = false;
    obj.required = Object.keys(obj.properties as Record<string, unknown>);
  }

  for (const key of Object.keys(obj)) {
    if (key === "additionalProperties" || key === "required") continue;
    obj[key] = toStrictSchema(obj[key]);
  }

  return obj;
}

const STAGE_HINTS: Partial<Record<StageSchemaKey, string>> = {
  eval: `IMPORTANT structure rules:
- offlineCases MUST be a flat array of objects, each with: category, input, expected
- onlineMetrics MUST be a flat array of objects, each with: metric, definition, target
- badCases MUST be a flat array of objects, each with: type, example, handling
- launchGates MUST be a flat array of objects, each with: metric, threshold, rationale
- Do NOT wrap any of these arrays inside objects
- Do NOT use nested arrays; each element is a single object
- Do NOT add any root-level fields besides offlineCases, onlineMetrics, badCases, launchGates`,
  solution: `IMPORTANT structure rules:
- options MUST be a flat array of at least 2 objects
- Each option MUST have: name, pros, cons, fit, complexity
- pros MUST be a flat array of STRINGS
- cons MUST be a flat array of STRINGS
- Do NOT wrap arrays inside objects; do NOT use nested arrays
- Do NOT add root-level fields besides options and recommendation`,
  redteam: `IMPORTANT structure rules:
- parties MUST be a flat array of 5 objects, each with role in [algo, eng, design, legal, user]
- Each party.concerns MUST be a flat array of objects, each with exactly 4 fields: concern, severity, evidence, fix
- topRisks MUST be a FLAT array of STRINGS. Each element is one sentence. Do NOT wrap in nested arrays.
- nextSteps MUST be a FLAT array of STRINGS. Each element is one action. Do NOT wrap in nested arrays.
- Do NOT add any root-level fields besides parties, topRisks, nextSteps.`,
};

export function getToolForStage(stage: StageSchemaKey): Tool {
  const jsonSchema = toStrictSchema(zodToJsonSchema(StageSchemaMap[stage]));
  const hint = STAGE_HINTS[stage];
  return {
    name: `output_${stage}`,
    description: `Return the structured ${stage} output.${hint ? "\n" + hint : ""}`,
    input_schema: jsonSchema as Tool["input_schema"],
    strict: true,
  };
}
