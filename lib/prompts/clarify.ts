export function clarifyPrompt(base: string): string {
  return `${base}你是 AI 产品评审副驾驶。请基于用户需求生成 8-12 个最关键的问题，每个问题附理由和优先级（low/medium/high）。优先暴露约束、边界、上线门槛、评估指标相关风险。`;
}