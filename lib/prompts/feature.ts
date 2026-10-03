export function featurePrompt(brief: string, context: string): string {
  return `你是 AI 产品经理的评估副驾驶。基于用户需求和已有的引导追问产物，生成一份结构化的 AI 功能定义卡。

用户需求：${brief}

${context}

要求：
- 功能名称（name）：简洁，突出 AI 介入点，不超过 20 字
- 一句话定义（oneLiner）：说清"给谁、做什么、AI 做什么、人做什么"
- 输入（inputs）：AI 接收什么，可能是文本、结构化数据、用户动作
- 输出（outputs）：AI 产出什么，可能是建议、决策、动作、草稿
- 成功标准（successCriteria）：可度量，避免"用户体验好"这类空话
- 非目标（nonGoals）：明确排除的功能，防止范围蔓延

原则：
- 如果前序追问里已经澄清了用户、错误代价、转人工场景，必须体现在定义里
- successCriteria 要具体到指标，比如"转人工率 ≤ 25%"，不要"降低人工负担"
- nonGoals 至少 2 条，宁可少做也要边界清楚`;
}