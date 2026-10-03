import { getToolForStage } from "../lib/ai/toolDefs";

const stages = ["clarify", "feature", "solution", "eval", "redteam"] as const;

for (const stage of stages) {
  const tool = getToolForStage(stage);
  console.log(`=== ${stage} ===`);
  console.log(JSON.stringify(tool, null, 2));
  console.log("");
}
