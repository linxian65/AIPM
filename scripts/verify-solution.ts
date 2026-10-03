// End-to-end verification for C3 (solution stage).
// - Creates project
// - Runs clarify + feature via HTTP API
// - Builds + logs the exact solution prompt that runStage would send
// - POSTs /api/stages/solution, verifies options[] + recommendation
// - Verifies DB row (currentStage=solution, version=1)
// - Re-POSTs, verifies version=2
// - Cleans up
//
// Uses the running `pnpm dev` server on localhost:3000.

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

function shape(s: unknown) {
  if (s && typeof s === "object") {
    const o = s as Record<string, unknown>;
    return Object.keys(o).sort();
  }
  return [];
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");

  await waitForServer();
  console.log("[setup] dev server ready\n");

  const project = await prisma.project.create({
    data: {
      title: "verify-solution",
      brief:
        "电商客服退换货 Agent：用户咨询订单状态与退换货时自动查询订单系统、判断是否符合政策并生成处理动作，复杂场景转人工。",
    },
  });
  console.log(`[setup] project ${project.id}\n`);

  // 1. clarify
  console.log("→ POST /api/stages/clarify");
  const c1 = await postJSON("/api/stages/clarify", { projectId: project.id });
  console.log(`  status=${c1.status} ok=${c1.data.ok} v=${c1.data.version}`);

  // 2. feature
  console.log("→ POST /api/stages/feature");
  const f1 = await postJSON("/api/stages/feature", { projectId: project.id });
  console.log(`  status=${f1.status} ok=${f1.data.ok} v=${f1.data.version}`);

  // 3. reconstruct the prompt runStage will send for solution
  const prevOutputs = await prisma.stageOutput.findMany({
    where: { projectId: project.id, stage: { in: ["clarify", "feature"] } },
    orderBy: [{ stage: "asc" }, { version: "desc" }],
  });
  const ctx: Record<string, unknown> = {};
  for (const o of prevOutputs) if (!(o.stage in ctx)) ctx[o.stage] = o.content;

  console.log("\n--- prompt runStage will send for solution ---");
  const prompt = getPromptForStage("solution", project.brief, ctx);
  console.log(prompt);
  console.log(`\n[payload] prompt length=${prompt.length} chars`);
  console.log(`[payload] contains "已有产物": ${prompt.includes("已有产物")}`);
  console.log(`[payload] contains "feature": ${prompt.includes("feature") || prompt.includes("功能定义")}`);
  console.log(`[payload] contains "clarify": ${prompt.includes("clarify") || prompt.includes("引导追问")}`);
  console.log(`[payload] previous stages in ctx: ${Object.keys(ctx).join(", ")}\n`);

  // 4. solution (1st run)
  console.log("→ POST /api/stages/solution (run 1)");
  const s1 = await postJSON("/api/stages/solution", { projectId: project.id });
  console.log(`  status=${s1.status} ok=${s1.data.ok} v=${s1.data.version}`);
  if (!s1.data.ok) {
    console.log(`  err: ${s1.data.error}`);
    throw new Error("solution run 1 failed");
  }
  const d1 = s1.data.data as Record<string, unknown>;
  console.log(`  response keys: ${shape(d1).join(", ")}`);
  console.log(`  options is array: ${Array.isArray(d1.options)}  length=${(d1.options as unknown[])?.length}`);
  console.log(`  recommendation: ${typeof d1.recommendation === "string" ? (d1.recommendation as string).slice(0, 60) + "..." : d1.recommendation}`);

  // 5. DB checks after run 1
  const proj1 = await prisma.project.findUnique({ where: { id: project.id } });
  const out1 = await prisma.stageOutput.findMany({
    where: { projectId: project.id, stage: "solution" },
    orderBy: { version: "desc" },
  });
  console.log(`\n[db] currentStage=${proj1?.currentStage}`);
  console.log(`[db] solution StageOutput rows=${out1.length} latest version=${out1[0]?.version}`);

  // 6. solution (2nd run) → version=2
  console.log("\n→ POST /api/stages/solution (run 2)");
  const s2 = await postJSON("/api/stages/solution", { projectId: project.id });
  console.log(`  status=${s2.status} ok=${s2.data.ok} v=${s2.data.version}`);
  if (!s2.data.ok) throw new Error("solution run 2 failed");

  const out2 = await prisma.stageOutput.findMany({
    where: { projectId: project.id, stage: "solution" },
    orderBy: { version: "desc" },
  });
  console.log(`[db] solution StageOutput rows=${out2.length} latest version=${out2[0]?.version}`);

  // cleanup
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
