export function solutionPrompt(base: string, context: string): string {
  return `${base}${context}基于功能定义卡，给出至少 2 个可对比的实现方案（按实现思路区分），每个方案给出 pros、cons、fit、complexity，并给出最终推荐。`;
}