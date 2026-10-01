export function featurePrompt(base: string, context: string): string {
  return `${base}${context}基于澄清阶段的关键问题，输出一张结构化的功能定义卡：name、oneLiner、inputs、outputs、successCriteria、nonGoals。要求可执行，避免空话。`;
}