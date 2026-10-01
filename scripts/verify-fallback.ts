import { StageSchemaMap, type StageSchemaKey } from "../lib/schemas";
import { buildFallback } from "../lib/ai/fallback";

const stages: StageSchemaKey[] = [
  "clarify",
  "feature",
  "solution",
  "eval",
  "redteam",
];

let allPass = true;

for (const stage of stages) {
  const data = buildFallback(stage);
  const result = StageSchemaMap[stage].safeParse(data);
  if (result.success) {
    console.log(`${stage.padEnd(10)} ✓`);
  } else {
    allPass = false;
    console.log(`${stage.padEnd(10)} ✗`);
    for (const issue of result.error.issues) {
      console.log(`   ${issue.path.join(".") || "<root>"}: ${issue.message}`);
    }
  }
}

if (!allPass) process.exit(1);
console.log("\nAll fallbacks valid");