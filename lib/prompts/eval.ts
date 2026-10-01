export function evalPrompt(base: string, context: string): string {
  return `${base}${context}基于选定方案，生成评估体系：≥4 个离线用例（覆盖 positive/negative/edge/adversarial）、≥3 个在线指标、≥2 个 bad case 分类及处理、≥2 个 launch gate（指标 + 阈值 + 理由）。`;
}