// End-to-end verification for C4 (eval stage).
// - Creates project
// - Runs clarify + feature + solution via HTTP API
// - Builds + logs the eval prompt that runStage will send (with all 3 prior outputs)
// - POSTs /api/stages/eval, verifies shape (offlineCases≥4 covering 4 categories, onlineMetrics≥3, badCases≥2, launchGates≥2)
// - Verifies DB row (currentStage=eval, version=1)
// - Re-POSTs, verifies version=2
// - Cleans up

import { prisma } from "../lib/db";
import { getPromptForStage } from "../lib/prompts";

const BASE = "http://localhost:3000";

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${BASE}/api/stages/clarify`, { method: "POST" });
      if (res.status < 500) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("dev server not ready");
}

async function postJSON(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");

  await waitForServer();
  console.log("[setup] dev server ready\n");

  const project = await prisma.project.create({
    data: {
      title: "verify-eval",
      brief:
        "电商客服退换货 Agent：用户咨询订单状态与退换货时自动查询订单系统、判断是否符合政策并生成处理动作，复杂场景转人工。",
    },
  });
  console.log(`[setup] project ${project.id}\n`);

  // 1. clarify + feature + solution
  for (const stage of ["clarify", "feature", "solution"] as const) {
    console.log(`→ POST /api/stages/${stage}`);
    const r = await postJSON(`/api/stages/${stage}`, { projectId: project.id });
    console.log(`  status=${r.status} ok=${r.data.ok} v=${r.data.version}\n`);
  }

  // 2. Reconstruct eval prompt
  const prevOutputs = await prisma.stageOutput.findMany({
    where: {
      projectId: project.id,
      stage: { in: ["clarify", "feature", "solution"] },
    },
    orderBy: [{ stage: "asc" }, { version: "desc" }],
  });
  const ctx: Record<string, unknown> = {};
  for (const o of prevOutputs) if (!(o.stage in ctx)) ctx[o.stage] = o.content;

  console.log("--- eval prompt (head 800 chars) ---");
  const prompt = getPromptForStage("eval", project.brief, ctx);
  console.log(prompt.slice(0, 800) + "\n[...truncated]\n");
  console.log(`[payload] prompt length=${prompt.length} chars`);
  console.log(`[payload] previous stages in ctx: ${Object.keys(ctx).join(", ")}`);
  console.log(`[payload] contains solution/方案: ${prompt.includes("solution") || prompt.includes("方案")}\n`);

  // 3. eval (run 1)
  console.log("→ POST /api/stages/eval (run 1)");
  const e1 = await postJSON("/api/stages/eval", { projectId: project.id });
  console.log(`  status=${e1.status} ok=${e1.data.ok} v=${e1.data.version}`);
  if (!e1.data.ok) {
    console.log(`  err: ${e1.data.error}`);
    throw new Error("eval run 1 failed");
  }
  const d = e1.data.data as Record<string, unknown>;

  const offline = (d.offlineCases as Array<{ category: string }>) ?? [];
  const cats = new Set(offline.map((c) => c.category));
  console.log(`  offlineCases: ${offline.length}  categories=[${[...cats].join(",")}]  all4=${cats.size === 4}`);
  console.log(`  onlineMetrics: ${((d.onlineMetrics as unknown[]) ?? []).length}`);
  console.log(`  badCases: ${((d.badCases as unknown[]) ?? []).length}`);
  console.log(`  launchGates: ${((d.launchGates as unknown[]) ?? []).length}`);

  const offlineOk = offline.length >= 4 && cats.size === 4;
  const onlineOk = ((d.onlineMetrics as unknown[]) ?? []).length >= 3;
  const badOk = ((d.badCases as unknown[]) ?? []).length >= 2;
  const gateOk = ((d.launchGates as unknown[]) ?? []).length >= 2;
  console.log(`\n[shape] offlineCases>=4 + 4 categories: ${offlineOk}`);
  console.log(`[shape] onlineMetrics>=3: ${onlineOk}`);
  console.log(`[shape] badCases>=2: ${badOk}`);
  console.log(`[shape] launchGates>=2: ${gateOk}`);
  if (!(offlineOk && onlineOk && badOk && gateOk)) throw new Error("shape constraints failed");

  // 4. DB checks
  const proj = await prisma.project.findUnique({ where: { id: project.id } });
  const rows = await prisma.stageOutput.findMany({
    where: { projectId: project.id, stage: "eval" },
    orderBy: { version: "desc" },
  });
  console.log(`\n[db] currentStage=${proj?.currentStage}`);
  console.log(`[db] eval StageOutput rows=${rows.length} latest version=${rows[0]?.version}`);

  // 5. eval (run 2) → version=2
  console.log("\n→ POST /api/stages/eval (run 2)");
  const e2 = await postJSON("/api/stages/eval", { projectId: project.id });
  console.log(`  status=${e2.status} ok=${e2.data.ok} v=${e2.data.version}`);
  if (!e2.data.ok) throw new Error("eval run 2 failed");

  const rows2 = await prisma.stageOutput.findMany({
    where: { projectId: project.id, stage: "eval" },
    orderBy: { version: "desc" },
  });
  console.log(`[db] eval StageOutput rows=${rows2.length} latest version=${rows2[0]?.version}`);

  await prisma.stageOutput.deleteMany({ where: { projectId: project.id } });
  await prisma.project.delete({ where: { id: project.id } });
  console.log("\n[cleanup] done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
