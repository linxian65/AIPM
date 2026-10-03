// Run redteam 3x on existing project, with the new STAGE_HINTS + prompt structure section.
// Records per-run: ok/fail, parties count, roles covered, topRisks/nextSteps flatness.

import { prisma } from "../lib/db";

const BASE = "http://localhost:3001";
const PROJECT_ID = "cmur5w3go0000usnkb3akocjz";
const RUNS = 3;

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

  let okCount = 0;

  for (let i = 1; i <= RUNS; i++) {
    console.log(`--- run ${i}/${RUNS} ---`);
    const r = await postJSON("/api/stages/redteam", { projectId: PROJECT_ID });
    console.log(`  status=${r.status}  ok=${r.data.ok}  v=${r.data.version}  ${r.ms}ms`);

    if (!r.data.ok) {
      console.log(`  err: ${r.data.error?.slice(0, 200)}`);
      continue;
    }
    okCount++;

    const d = r.data.data as Record<string, unknown>;
    const parties = (d.parties as Array<{ role: string; concerns: unknown[] }>) ?? [];
    const roles = new Set(parties.map((p) => p.role));
    const topRisks = d.topRisks;
    const nextSteps = d.nextSteps;
    const topFlat = Array.isArray(topRisks) && topRisks.every((x) => typeof x === "string");
    const nextFlat = Array.isArray(nextSteps) && nextSteps.every((x) => typeof x === "string");
    const rootKeys = Object.keys(d).sort().join(",");
    console.log(`  parties=${parties.length}  roles=[${[...roles].join(",")}]  missing5=[${["algo","eng","design","legal","user"].filter(r=>!roles.has(r)).join(",")}]`);
    console.log(`  topRisks: ${Array.isArray(topRisks) ? (topRisks as unknown[]).length : "NOT_ARRAY"} items, all-string=${topFlat}`);
    console.log(`  nextSteps: ${Array.isArray(nextSteps) ? (nextSteps as unknown[]).length : "NOT_ARRAY"} items, all-string=${nextFlat}`);
    console.log(`  root keys: [${rootKeys}]  (expect: nextSteps,parties,topRisks)`);
    console.log("");
  }

  console.log(`=== summary: ${okCount}/${RUNS} succeeded ===\n`);

  // Final DB stats
  const rows = await prisma.stageOutput.findMany({
    where: { projectId: PROJECT_ID, stage: "redteam" },
    orderBy: { version: "desc" },
  });
  console.log(`[db] redteam rows: ${rows.length} (versions: ${rows.map((r) => r.version).join(", ")})`);
  const proj = await prisma.project.findUnique({ where: { id: PROJECT_ID } });
  console.log(`[db] currentStage: ${proj?.currentStage}`);

  console.log("\n[cleanup] NOT cleaning up project (per user spec)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
