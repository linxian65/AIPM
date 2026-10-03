// C6 verification: OutputPane structured views for 5 stages + EmptyState.
// Uses curl on running dev server.
// - Full project: cmur5w3go0000usnkb3akocjz (all 5 stages done)
// - Sparse project: created here with only clarify, tests EmptyState on feature stage

import { prisma } from "../lib/db";

const BASE = "http://localhost:3000";
const FULL_PROJECT = "cmur5w3go0000usnkb3akocjz";

interface StageCheck {
  stage: string;
  markers: string[];
  label: string;
}

const STAGE_CHECKS: StageCheck[] = [
  { stage: "clarify", label: "引导追问", markers: ["引导追问", "条", "high", "medium", "low"] },
  { stage: "feature", label: "功能定义卡", markers: ["功能定义卡", "输入", "输出", "成功标准", "非目标"] },
  { stage: "solution", label: "方案对比", markers: ["方案对比", "个方案", "优点", "缺点", "推荐"] },
  { stage: "eval", label: "评估方案", markers: ["评估方案", "离线评估集", "在线指标", "Bad case 分类", "上线门槛"] },
  { stage: "redteam", label: "红队评审", markers: ["红队评审", "方", "Top 风险", "下一步", "算法", "工程", "设计", "法务", "用户"] },
];

async function fetchHTML(path: string): Promise<string> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.text();
}

async function main() {
  console.log(`[setup] hitting ${BASE}\n`);

  console.log(`=== Full project: ${FULL_PROJECT} ===`);
  for (const c of STAGE_CHECKS) {
    const html = await fetchHTML(`/project/${FULL_PROJECT}?stage=${c.stage}`);
    const found = c.markers.map((m) => ({ m, ok: html.includes(m) }));
    const missing = found.filter((f) => !f.ok);
    console.log(`  ?stage=${c.stage.padEnd(8)}  markers ${missing.length === 0 ? "OK" : "MISS"} (${found.length - missing.length}/${found.length})`);
    if (missing.length > 0) console.log(`    missing: ${missing.map((x) => x.m).join(", ")}`);
  }

  // Create a sparse project (only clarify) to test EmptyState on other stages
  console.log("\n=== Sparse project (only clarify) ===");
  const sparse = await prisma.project.create({
    data: {
      title: "verify-c6-sparse",
      brief: "测试稀疏项目：仅跑过 clarify，确认空状态。",
    },
  });
  await prisma.stageOutput.create({
    data: {
      projectId: sparse.id,
      stage: "clarify",
      content: {
        questions: [
          { priority: "high", question: "测试问题 1", rationale: "测试" },
        ],
      },
      version: 1,
    },
  });
  // currentStage should advance to clarify since result.ok is forced true at insert time
  await prisma.project.update({
    where: { id: sparse.id },
    data: { currentStage: "clarify" },
  });

  // Switch to feature — should show EmptyState
  const html = await fetchHTML(`/project/${sparse.id}?stage=feature`);
  const emptyMarkers = ["点击中间栏", "输出", "功能定义卡"];
  const emptyFound = emptyMarkers.map((m) => ({ m, ok: html.includes(m) }));
  const emptyMissing = emptyFound.filter((f) => !f.ok);
  console.log(`  ?stage=feature  empty state: ${emptyMissing.length === 0 ? "OK" : "MISS"} (${emptyFound.length - emptyMissing.length}/${emptyFound.length})`);
  if (emptyMissing.length > 0) console.log(`    missing: ${emptyMissing.map((x) => x.m).join(", ")}`);

  // Also check eval (still empty) shows empty state
  const html2 = await fetchHTML(`/project/${sparse.id}?stage=eval`);
  const hasEvalEmpty = html2.includes("点击中间栏") && html2.includes("评估方案");
  console.log(`  ?stage=eval     empty state: ${hasEvalEmpty ? "OK" : "MISS"}`);

  // cleanup
  await prisma.stageOutput.deleteMany({ where: { projectId: sparse.id } });
  await prisma.project.delete({ where: { id: sparse.id } });
  console.log("\n[cleanup] sparse project deleted");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
