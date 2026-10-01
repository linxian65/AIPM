export function redteamPrompt(base: string, context: string): string {
  return `${base}${context}模拟 5 方红队质疑（algo / eng / design / legal / user），每方 ≥1 个 concern，给出 severity / evidence / fix。最后汇总 topRisks 和 nextSteps。`;
}