import {
  ClarifySchema,
  FeatureSchema,
  SolutionSchema,
  EvalSchema,
  RedTeamSchema,
  type StageName,
} from "@/lib/schemas";

type ProjectInput = { title: string; brief: string };
type OutputsByStage = Partial<Record<StageName, unknown>>;

function escapeCell(s: string): string {
  return s.replace(/\|/g, "\\|").replace(/\n+/g, " ");
}

function bulletList(items: string[], indent = ""): string {
  return items.map((it) => `${indent}- ${it}`).join("\n");
}

export function buildMarkdown(
  project: ProjectInput,
  outputs: OutputsByStage
): string {
  const parts: string[] = [];
  parts.push(`# ${project.title}\n`);
  parts.push(`> ${project.brief}\n`);

  // 一、需求澄清
  parts.push("## 一、需求澄清\n");
  const clarify = outputs.clarify ? ClarifySchema.safeParse(outputs.clarify) : null;
  if (clarify?.success) {
    parts.push(
      clarify.data.questions
        .map((q) => `- **[${q.priority}]** ${q.question}\n  - ${q.rationale}`)
        .join("\n")
    );
  } else {
    parts.push("（尚未生成）");
  }
  parts.push("");

  // 二、功能定义
  parts.push("## 二、功能定义\n");
  const feature = outputs.feature ? FeatureSchema.safeParse(outputs.feature) : null;
  if (feature?.success) {
    const f = feature.data;
    parts.push(`### ${f.name}\n`);
    parts.push(`${f.oneLiner}\n`);
    parts.push("**输入**\n");
    parts.push(bulletList(f.inputs) + "\n");
    parts.push("**输出**\n");
    parts.push(bulletList(f.outputs) + "\n");
    parts.push("**成功标准**\n");
    parts.push(bulletList(f.successCriteria) + "\n");
    parts.push("**非目标**\n");
    parts.push(bulletList(f.nonGoals) + "\n");
  } else {
    parts.push("（尚未生成）\n");
  }

  // 三、方案对比
  parts.push("## 三、方案对比\n");
  const solution = outputs.solution ? SolutionSchema.safeParse(outputs.solution) : null;
  if (solution?.success) {
    const s = solution.data;
    s.options.forEach((opt, i) => {
      parts.push(`### 方案 ${String.fromCharCode(65 + i)}：${opt.name}\n`);
      parts.push(`**复杂度**：${opt.complexity}\n`);
      parts.push("**优点**\n");
      parts.push(bulletList(opt.pros) + "\n");
      parts.push("**缺点**\n");
      parts.push(bulletList(opt.cons) + "\n");
      parts.push(`**适用场景**：${opt.fit}\n`);
    });
    parts.push(`### 推荐\n\n${s.recommendation}\n`);
  } else {
    parts.push("（尚未生成）\n");
  }

  // 四、评估方案
  parts.push("## 四、评估方案\n");
  const evalData = outputs.eval ? EvalSchema.safeParse(outputs.eval) : null;
  if (evalData?.success) {
    const e = evalData.data;

    parts.push("### 4.1 离线评估集\n");
    parts.push("| 类型 | 输入 | 期望输出 |");
    parts.push("| --- | --- | --- |");
    e.offlineCases.forEach((c) => {
      parts.push(`| ${c.category} | ${escapeCell(c.input)} | ${escapeCell(c.expected)} |`);
    });
    parts.push("");

    parts.push("### 4.2 在线指标\n");
    parts.push("| 指标 | 定义 | 目标 |");
    parts.push("| --- | --- | --- |");
    e.onlineMetrics.forEach((m) => {
      parts.push(`| ${escapeCell(m.metric)} | ${escapeCell(m.definition)} | ${escapeCell(m.target)} |`);
    });
    parts.push("");

    parts.push("### 4.3 Bad case 分类\n");
    parts.push("| 类型 | 示例 | 处理策略 |");
    parts.push("| --- | --- | --- |");
    e.badCases.forEach((b) => {
      parts.push(`| ${escapeCell(b.type)} | ${escapeCell(b.example)} | ${escapeCell(b.handling)} |`);
    });
    parts.push("");

    parts.push("### 4.4 上线门槛\n");
    parts.push("| 指标 | 阈值 | 依据 |");
    parts.push("| --- | --- | --- |");
    e.launchGates.forEach((g) => {
      parts.push(`| ${escapeCell(g.metric)} | ${escapeCell(g.threshold)} | ${escapeCell(g.rationale)} |`);
    });
    parts.push("");
  } else {
    parts.push("（尚未生成）\n");
  }

  // 五、风险清单
  parts.push("## 五、风险清单\n");
  const redteam = outputs.redteam ? RedTeamSchema.safeParse(outputs.redteam) : null;
  if (redteam?.success) {
    const ROLE_LABEL: Record<string, string> = {
      algo: "算法", eng: "工程", design: "设计",
      legal: "法务", user: "用户",
    };
    redteam.data.parties.forEach((p) => {
      parts.push(`### ${ROLE_LABEL[p.role] ?? p.role}\n`);
      p.concerns.forEach((c) => {
        parts.push(`- **[${c.severity}]** ${c.concern}\n`);
        parts.push(`  - 依据：${c.evidence}\n`);
        parts.push(`  - 改进：${c.fix}`);
      });
      parts.push("");
    });
  } else {
    parts.push("（尚未生成）\n");
  }

  // 六、实验计划
  parts.push("## 六、实验计划\n");
  if (redteam?.success) {
    parts.push("### Top 风险\n");
    parts.push(redteam.data.topRisks.map((r, i) => `${i + 1}. ${r}`).join("\n") + "\n");
    parts.push("### 下一步\n");
    parts.push(redteam.data.nextSteps.map((s, i) => `${i + 1}. ${s}`).join("\n") + "\n");
  } else {
    parts.push("（尚未生成）\n");
  }

  return parts.join("\n");
}
