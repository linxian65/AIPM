export function evalPrompt(brief: string, context: string): string {
  return `你是 AI 产品经理的评估副驾驶。基于用户需求、功能定义卡和方案对比，生成一套可执行的评估方案。

用户需求：${brief}

${context}

约束读取规则（一环扣一环的关键）：
- 上游产物里的 \`clarify.clarifiedConstraints\` 是用户已确认的约束（错误代价、可容忍错误率、合规边界、延迟/成本预算、必须转人工的场景等）
- 如果非空，其中的每一条必须体现在：
  - onlineMetrics 的 target：具体的数字和单位，例如"P95 延迟 ≤ 2s"、"单次成本 ≤ ¥0.05"、"误判率 ≤ 5%"
  - launchGates 的 threshold：可量化的上线门槛
  - badCases：要覆盖用户特别提到的风险类别
- 如果是空数组（首轮 / 用户没回答），按功能定义卡和方案对比里的指标推断即可，不要硬编

你需要产出四个部分：

一、离线评估集（offlineCases，至少 4 条，覆盖四类）
- category 必须是以下之一：positive / negative / edge / adversarial
  - positive：正常场景，AI 应该正确响应
  - negative：不应回答或应拒绝的场景
  - edge：边界情况，如空输入、超长输入、多意图混合
  - adversarial：对抗攻击，如提示注入、越权请求、诱导幻觉
- input：用户实际会输入的文本或动作
- expected：期望 AI 的响应，具体到内容层面，不要"回答正确"这种空话

二、在线指标（onlineMetrics，至少 3 条）
每条包含：
- metric：指标名，如"采纳率"、"转人工率"、"P95 延迟"、"单次成本"
- definition：如何计算，说清分子分母
- target：上线目标值，带数字和单位，如"≥ 70%"、"≤ 3s"、"≤ ¥0.05/次"

三、Bad case 分类（badCases，至少 2 条）
每条包含：
- type：失败类型，如"幻觉"、"知识缺失"、"意图误解"、"工具调用错误"、"越权"、"语气不当"
- example：一个具体的失败例子
- handling：检测方式 + 处理策略，如"通过引用来源对比检测，缺失引用时降级为转人工"

四、上线门槛（launchGates，至少 2 条）
每条包含：
- metric：门槛对应的指标
- threshold：具体阈值，如"采纳率 ≥ 85%"
- rationale：为什么定这个门槛，不达标的后果是什么

原则：
- 评估用例要基于功能定义卡的输入输出，不要脱离场景
- 在线指标要和前面的成功标准对齐
- bad case 分类要覆盖 AI 产品典型失效模式，不要泛泛的"回答错误"
- 上线门槛要有数字，不要"表现良好"这种模糊表述
- 如果方案对比里选了特定技术路线（如 RAG），评估要覆盖该路线特有的风险`;
}
