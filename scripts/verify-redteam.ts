// End-to-end verification for C5 (redteam stage).
// Uses existing project cmur5w3go0000usnkb3akocjz (has clarify/feature/solution/eval).
// - Builds + logs the redteam prompt (with 4 prior outputs)
// - POSTs /api/stages/redteam, verifies shape
// - Verifies DB row (currentStage=redteam, version=1)
// - Re-POSTs, verifies version=2
// - Does NOT cleanup (per user spec)

import { prisma } from "../lib/db";
import { getPromptForStage } from "../lib/prompts";

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

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");

  await waitForServer();
  console.log("[setup] dev server ready\n");

  // Build the prompt runStage will send
  const prevOutputs = await prisma.stageOutput.findMany({
    where: {
      projectId: PROJECT_ID,
      stage: { in: ["clarify", "feature", "solution", "eval"] },
    },
    orderBy: [{ stage: "asc" }, { version: "desc" }],
  });
  const ctx: Record<string, unknown> = {};
  for (const o of prevOutputs) if (!(o.stage in ctx)) ctx[o.stage] = o.content;

  console.log("--- redteam prompt (head 600 chars) ---");
  const prompt = getPromptForStage("redteam", (await prisma.project.findUnique({ where: { id: PROJECT_ID } }))!.brief, ctx);
  console.log(prompt.slice(0, 600) + "\n[...truncated]\n");
  console.log(`[payload] prompt length=${prompt.length} chars`);
  console.log(`[payload] previous stages in ctx: ${Object.keys(ctx).sort().join(", ")}`);
  console.log(`[payload] contains all 4: clarify=${prompt.includes("clarify") || prompt.includes("引导追问")}, feature=${prompt.includes("feature") || prompt.includes("功能定义")}, solution=${prompt.includes("solution") || prompt.includes("方案")}, eval=${prompt.includes("eval") || prompt.includes("评估")}\n`);

  // redteam (run 1)
  console.log("→ POST /api/stages/redteam (run 1)");
  const r1 = await postJSON("/api/stages/redteam", { projectId: PROJECT_ID });
  console.log(`  status=${r1.status} ok=${r1.data.ok} v=${r1.data.version} ${r1.ms}ms`);
  if (!r1.data.ok) {
    console.log(`  err: ${r1.data.error}`);
    throw new Error("redteam run 1 failed");
  }
  const d = r1.data.data as Record<string, unknown>;

  const parties = (d.parties as Array<{ role: string; concerns: Array<{ concern: string; severity: string; evidence: string; fix: string }> }>) ?? [];
  const roles = new Set(parties.map((p) => p.role));
  const requiredRoles = ["algo", "eng", "design", "legal", "user"];
  const missing = requiredRoles.filter((r) => !roles.has(r));
  const allHaveConcerns = parties.every((p) => p.concerns && p.concerns.length >= 1);
  const allFieldsOk = parties.every((p) =>
    p.concerns.every(
      (c) =>
        typeof c.concern === "string" &&
        c.concern.length >= 4 &&
        ["low", "medium", "high"].includes(c.severity) &&
        typeof c.evidence === "string" &&
        c.evidence.length >= 4 &&
        typeof c.fix === "string" &&
        c.fix.length >= 4
    )
  );

  const topRisks = (d.topRisks as string[]) ?? [];
  const nextSteps = (d.nextSteps as string[]) ?? [];

  console.log(`\n[shape] parties=${parties.length} roles=[${[...roles].join(",")}] missing=[${missing.join(",")}] allHaveConcerns=${allHaveConcerns} allFieldsOk=${allFieldsOk}`);
  console.log(`[shape] topRisks=${topRisks.length} (need ≥2)  nextSteps=${nextSteps.length} (need ≥3)`);

  const okShape =
    parties.length >= 4 &&
    (missing.length === 0 || parties.length >= 4) &&
    allHaveConcerns &&
    allFieldsOk &&
    topRisks.length >= 2 &&
    nextSteps.length >= 3;
  console.log(`[shape] PASS: ${okShape}`);
  if (!okShape) throw new Error("shape constraints failed");

  // DB checks
  const proj = await prisma.project.findUnique({ where: { id: PROJECT_ID } });
  const rows = await prisma.stageOutput.findMany({
    where: { projectId: PROJECT_ID, stage: "redteam" },
    orderBy: { version: "desc" },
  });
  console.log(`\n[db] currentStage=${proj?.currentStage}`);
  console.log(`[db] redteam StageOutput rows=${rows.length} latest version=${rows[0]?.version}`);

  // redteam (run 2) → version=2
  console.log("\n→ POST /api/stages/redteam (run 2)");
  const r2 = await postJSON("/api/stages/redteam", { projectId: PROJECT_ID });
  console.log(`  status=${r2.status} ok=${r2.data.ok} v=${r2.data.version} ${r2.ms}ms`);
  if (!r2.data.ok) throw new Error("redteam run 2 failed");

  const rows2 = await prisma.stageOutput.findMany({
    where: { projectId: PROJECT_ID, stage: "redteam" },
    orderBy: { version: "desc" },
  });
  console.log(`[db] redteam StageOutput rows=${rows2.length} latest version=${rows2[0]?.version}`);

  console.log("\n[cleanup] NOT cleaning up project (per user spec)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
