import type { StageSchemaKey } from "@/lib/schemas";

export function buildFallback(stage: StageSchemaKey): unknown {
  switch (stage) {
    case "clarify":
      return {
        questions: [
          {
            question: "生成失败，请点击重试。",
            rationale: "模型调用或输出校验未通过。",
            priority: "high" as const,
          },
        ],
      };
    case "feature":
      return {
        name: "生成失败",
        oneLiner: "请重试。",
        inputs: ["—"],
        outputs: ["—"],
        successCriteria: ["—"],
        nonGoals: ["—"],
      };
    case "solution":
      return {
        options: [
          {
            name: "生成失败",
            pros: ["—"],
            cons: ["—"],
            fit: "请重试。",
            complexity: "low" as const,
          },
        ],
        recommendation: "请重试。",
      };
    case "eval":
      return {
        offlineCases: [],
        onlineMetrics: [],
        badCases: [],
        launchGates: [],
      };
    case "redteam":
      return {
        parties: [],
        topRisks: ["生成失败，请重试。"],
        nextSteps: ["生成失败，请重试。"],
      };
  }
}