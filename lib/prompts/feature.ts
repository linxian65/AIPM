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

约束读取规则（核心，一环扣一环的关键）：
- 上游产物里的 \`clarify.clarifiedConstraints\` 是用户在引导追问环节已确认的约束（用户回答被提炼后的结构化陈述）
- 如果 \`clarifiedConstraints\` 非空（数组里有内容），其中的每一条都必须直接体现在：
  - inputs / outputs：具体到约束中的场景，不要泛指
  - successCriteria：数字化的目标，例如"转人工率 ≤ 25%"、"误判率 ≤ 5%"
  - nonGoals：明确排除项
- 优先级高于你从 questions 推断出的内容
- 如果 \`clarifiedConstraints\` 是空数组（首轮 / 用户没回答），按正常流程从 questions 推断即可，不要硬编约束

原则：
- successCriteria 要具体到指标，比如"转人工率 ≤ 25%"，不要"降低人工负担"
- nonGoals 至少 2 条，宁可少做也要边界清楚`;
}
