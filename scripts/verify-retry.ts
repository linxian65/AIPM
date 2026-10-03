// Verify retry behavior on the existing failed project.
// - POST /api/stages/eval  (will create eval v2)
// - POST /api/stages/solution  (will create solution v2)
// - Inspect DB to count fallback vs real outputs

import { prisma } from "../lib/db";

const BASE = "http://localhost:3000";
const PROJECT_ID = "cmur5w3go0000usnkb3akocjz";

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
  const t0 = Date.now();
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { status: res.status, data, ms: Date.now() - t0 };
}

function looksLikeFallback(content: unknown, stage: string): boolean {
  // heuristic: check for the unique "模型编造不存在的政策或用户信息" string
  // that only appears in eval/solution/redteam fallback. For feature fallback
  // we check "待定义 AI 功能".
  const s = JSON.stringify(content);
  if (stage === "eval")
    return s.includes("模型编造不存在的政策或用户信息") && s.includes("接入事实校验或限制引用源");
  if (stage === "solution")
    return s.includes("单模型直出") && s.includes("结构化校验方案") && s.length < 1500;
  if (stage === "feature") return s.includes("待定义 AI 功能");
  if (stage === "clarify") return s.includes("目标用户是谁？在什么场景下会触发这个 AI 功能？");
  return false;
}

async function main() {
  await waitForServer();
  console.log("[setup] dev server ready\n");

  // eval
  console.log("→ POST /api/stages/eval");
  const e = await postJSON("/api/stages/eval", { projectId: PROJECT_ID });
  console.log(`  status=${e.status}  ok=${e.data.ok}  v=${e.data.version}  ${e.ms}ms`);
  if (!e.data.ok) console.log(`  err: ${e.data.error}`);

  // solution
  console.log("\n→ POST /api/stages/solution");
  const s = await postJSON("/api/stages/solution", { projectId: PROJECT_ID });
  console.log(`  status=${s.status}  ok=${s.data.ok}  v=${s.data.version}  ${s.ms}ms`);
  if (!s.data.ok) console.log(`  err: ${s.data.error}`);

  // DB stats
  console.log("\n--- DB stats for project ---");
  const outs = await prisma.stageOutput.findMany({
    where: { projectId: PROJECT_ID },
    orderBy: [{ stage: "asc" }, { version: "asc" }],
  });
  const proj = await prisma.project.findUnique({ where: { id: PROJECT_ID } });
  console.log(`currentStage: ${proj?.currentStage}\n`);

  for (const o of outs) {
    const isFb = looksLikeFallback(o.content, o.stage);
    console.log(
      `  ${o.stage.padEnd(8)} v=${o.version}  ${isFb ? "FALLBACK" : "real"}  content.len=${JSON.stringify(o.content).length}`
    );
  }

  // overall fallback rate
  const total = outs.length;
  const fallbackCount = outs.filter((o) => looksLikeFallback(o.content, o.stage)).length;
  console.log(`\n[stats] ${fallbackCount}/${total} = ${total > 0 ? ((fallbackCount / total) * 100).toFixed(1) : 0}% fallback`);
  console.log(`[stats] new fallback rows: eval v2=${looksLikeFallback(outs.find(o => o.stage === "eval" && o.version === 2)?.content, "eval") ? "YES" : "no"}, solution v2=${looksLikeFallback(outs.find(o => o.stage === "solution" && o.version === 2)?.content, "solution") ? "YES" : "no"}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
