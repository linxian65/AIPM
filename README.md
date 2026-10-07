# EvalCopilot

> 面向 AI 产品经理的评估副驾驶：从模糊需求，到可评审的 AI 功能方案。

## 它解决什么问题

AI 产品经理最缺的不是"写 PRD 的工具"，而是**在概率性系统里定义"什么算好、错了怎么办"**的能力。这是 AI PM 和传统 PM 的分水岭，也是当前工具链最缺失的一环。

EvalCopilot 把 AI PM 的核心工作流做成产品：

引导追问 → 功能定义 → 方案对比 → 评估方案 → 红队评审 → 导出 PRD

它不替代 PM 思考，而是**强制 PM 把问题想清楚、把评估定下来、把决策结构化**。

---

## 核心能力

**1. 五阶段工作流，每步都有结构化产物**

| Stage | 输出 |
|---|---|
| 引导追问 | 8-12 个关键追问（目标用户 / 错误代价 / 合规约束 / 成本延迟 / 成功指标） |
| 功能定义 | 定义卡（输入 / 输出 / 成功标准 / 非目标） |
| 方案对比 | ≥2 个技术方案 + 推荐 + 复杂度评估 |
| 评估方案 | 离线评估集 / 在线指标 / Bad case 分类 / 上线门槛 |
| 红队评审 | 算法 / 工程 / 设计 / 法务 / 用户五方关切 + Top 风险 + 下一步 |

**2. 用户反馈闭环，让 AI 决策链真正扣起来**

- **clarify**：用户逐条回答追问 → AI 把答案**沉淀为结构化约束**（`clarifiedConstraints`）→ 下游 stage 直接消费
- **solution**：用户选择方案 + 写理由 → AI 基于选择重写推荐 → eval / redteam 继承用户决策

**这不是"把用户反馈拼进 prompt"。** 用户答案在 clarify 修订轮次被提炼成约束，下游不需要二次推理，避免幻觉蔓延。

**3. 导出 Markdown PRD**

6 章节（需求澄清 / 功能定义 / 方案对比 / 评估方案 / 风险清单 / 实验计划），含 4 张评估表格，可直接进评审会。

---

## 实测数据

3 个真实场景（电商退换货 / 企业文档问答 / 销售邮件）端到端测试：

| 指标 | 数值 |
|---|---|
| 端到端成功率 | 11 / 15（73%） |
| 单 stage 最长耗时 | 83s（eval） |
| 单 stage 最短耗时 | 15s（feature） |
| fallback 落库率 | < 5% |

73% 不是缺陷，是 AI 产品的真实基线。关键是：**知道失败在哪、为什么失败、如何让失败可恢复**。

完整诊断过程见 [技术复盘](POSTMORTEM.md)。

---

## 技术栈

- **框架**：Next.js 14 App Router + TypeScript
- **数据**：Prisma 6 + Neon Postgres
- **模型**：MiniMax M3（Anthropic 兼容端点），模型 ID 从环境变量读，换上游零改动
- **校验**：Zod 3 + `tool_use` 结构化输出
- **UI**：Tailwind + shadcn/ui + react-markdown

---

## 关键设计决策

**1. 用 `tool_use` 而不是 JSON mode**

Anthropic API 没有 `response_format`，标准做法是定义 tool 让模型通过 `tool_use` 返回结构化数据。比"让模型输出 JSON 字符串再 parse"可靠得多。

**2. 三层防御约束模型输出**

- 工具 schema 层：剥离 min/max，所有属性 required，开启 strict
- tool description 层：每个 stage 加结构性提示
- prompt 层：加输出结构段落

**3. fallback 是降级产物，不是错误占位**

模型挂了，用户还能拿到通用的 AI PM 思考框架，同时 UI 明确标注"降级 + 重试"。**不隐藏失败，不放弃内容。**

**4. 用户反馈是独立字段，不是塞进 content**

`StageOutput.feedback` 独立存储，下游通过 sibling key 自动可见。不改 schema、不影响 strict 兼容性。

---

## 本地运行

```bash
pnpm install
cp .env.example .env
# 填入 DATABASE_URL / DIRECT_URL / ANTHROPIC_API_KEY / ANTHROPIC_BASE_URL / ANTHROPIC_MODEL
pnpm prisma migrate dev
pnpm db:seed
pnpm dev
