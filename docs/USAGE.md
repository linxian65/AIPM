# AI PM Copilot 使用指南

## 快速上手（3 步）

```bash
git clone https://github.com/linxian65/AIPM.git
cd AIPM
pnpm install
cp .env.example .env.local   # 编辑后填 5 个变量，见下文
pnpm prisma db push
pnpm db:seed                 # 种 3 个预置案例，否则 / 会显示"暂无预置案例"
pnpm dev
# → http://localhost:3000
```

---

## 一、前置准备

| 工具 | 版本 | 说明 |
|---|---|---|
| **Node.js** | ≥ 20 | Next.js 14 要求 |
| **pnpm** | ≥ 9 | `npm i -g pnpm` |
| **Neon 账号** | 免费档即可 | https://neon.tech 注册，建一个空 DB |
| **Anthropic API Key** | — | 这里走 MiniMax 代理，不是直连 Anthropic |

---

## 二、配置 `.env.local`

```bash
DATABASE_URL=postgresql://...-pooler...neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://...neon.tech/neondb?sslmode=require
ANTHROPIC_API_KEY=sk-xxxxxxxx
ANTHROPIC_BASE_URL=https://api.minimax.cn/anthropic
ANTHROPIC_MODEL=claude-sonnet-5
```

**关键点**：

- `DATABASE_URL` 必须是 Neon **pooler** 那个（端口 6543，hostname 带 `-pooler`），给运行时用
- `DIRECT_URL` 是 Neon **直连** 那个（端口 5432），给 Prisma 迁移用
- `ANTHROPIC_BASE_URL` **必须设**，否则默认走 Anthropic 官方，会 401
- 5 个变量缺一不可

---

## 三、首次启动

```bash
pnpm install                # 自动跑 prisma generate（postinstall）
pnpm prisma db push         # 把 schema 推到 Neon，建表
pnpm db:seed                # 种 3 个预置案例，否则首页是空的
pnpm dev                    # http://localhost:3000
```

打开 `/` 应该看到 3 个预置案例的网格。

---

## 四、使用流程

**两个入口**：

1. **预置案例**（`/` 首页）→ 选一个点进去，看完整 5 阶段 demo
2. **新建项目**（`/new`）→ 写一句话需求，开始走 5 阶段流程

**5 个阶段**（顺序执行，前一阶段是后一阶段的输入）：

```
引导追问 → 功能定义 → 方案对比 → 评估方案 → 红队评审
```

每一步点「生成」按钮，调一次 LLM，30 秒到 2 分钟出结果。

---

## 五、常见问题

**Q: 第一次访问 demo 页报 500**
A: Neon pooler 冷启动，刷新就好。如果经常失败，看 `DIRECT_URL` 是否配错。

**Q: 点「生成」返回 401 / 404**
A: 大概率 `ANTHROPIC_BASE_URL` 没设。检查 `.env.local` 是否生效（改完要重启 dev server）。

**Q: 5 个变量都设了但 `prisma db push` 失败**
A: 80% 是 `DIRECT_URL` 配错（用了 pooler URL）。Neon 控制台 Connection Details 里有两个连接串，别拿错。

**Q: 想清掉所有 demo 数据重新开始**
A: `pnpm prisma db push --force-reset`（**会清掉所有数据**，包括你自己建的项目）。

**Q: 想部署到 Vercel**
A: 把代码推到 GitHub → Vercel Import → 设同 5 个环境变量 → Deploy。注意 Vercel 也要设 `ANTHROPIC_BASE_URL`，没在 `.env.example` 里但代码会读。

---

## 六、项目结构速览

```
app/                          Next.js App Router
  page.tsx                    首页（预设网格）
  new/                        新建项目表单
  project/[id]/               工作台（5 阶段 tab）
  project/demo/[slug]/        预置案例入口（幂等）
  api/stages/[stage]/          阶段生成的 route handler

lib/
  ai/                         Anthropic 调用 + Zod 校验 + normalize
  prompts/                    每个 stage 的 prompt
  schemas/                    Zod schema（StageSchemaMap）
  presets/*.json              冻结的真实产物（demo 用）
  export/buildMarkdown.ts     导出 PRD Markdown

components/workbench/         UI 组件
scripts/                      一次性脚本（重试、补跑、导出预设、清理）
prisma/schema.prisma          DB schema
```

---

## 七、最重要的两个坑先记住

- **`ANTHROPIC_BASE_URL` 必填**（MiniMax 代理）
- **`DATABASE_URL` 是 pooler，`DIRECT_URL` 是直连**（不能搞反）