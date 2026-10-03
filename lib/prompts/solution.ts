export function solutionPrompt(brief: string, context: string): string {
  return `你是 AI 产品经理的评估副驾驶。基于用户需求、引导追问和功能定义卡，生成至少 2 个技术方案对比，并给出推荐。

用户需求：${brief}

${context}

要求：
- options 至少 2 个，每个包含：
  - name：方案名称，突出技术路线差异（如"单模型直出"、"RAG + 微调"、"规则引擎 + LLM 兜底"、"多 Agent 协作"）
  - pros：至少 2 条优点，具体到 AI 产品维度（成本、延迟、可控性、数据需求、迭代速度）
  - cons：至少 2 条缺点，要具体（不是"可能不准"，而是"冷启动阶段缺少标注数据，前 2 周幻觉率可能 > 10%"）
  - fit：适用场景，说清"什么条件下选这个方案"
  - complexity：low / medium / high，评估实现复杂度
- recommendation：明确推荐哪个方案，并说明为什么在当前约束下最优

原则：
- 方案差异要在技术路线层面，不要"方案 A vs 方案 A 的优化版"
- pros/cons 要落到 AI PM 关心的维度：成本、延迟、错误率、数据依赖、可解释性、合规
- recommendation 要基于 constraints（成本/延迟/合规），不能是"综合考虑"这种空话
- 如果功能定义卡里已经明确了错误代价或转人工场景，要在方案选择里体现`;
}
