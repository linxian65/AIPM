// Generic retry script: hit /api/stages/{stage} up to 6 times until ok=true
// AND the latest StageOutput content bytes exceed a per-stage threshold.
// Usage: tsx scripts/retry-stage.ts <stage> <projectId|titleKeyword>

import { prisma } from "../lib/db";
import type { StageSchemaKey } from "../lib/schemas";

const MAX_ATTEMPTS = 6;
const SLEEP_MS = 5000;
const TIMEOUT_MS = 200_000;
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";

const BYTES_THRESHOLD: Record<StageSchemaKey, number> = {
  clarify: 1500,
  feature: 800,
  solution: 2000,
  eval: 4000,
  redteam: 4000,
};

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function resolveProjectId(ref: string): Promise<string> {
  // cuid is ~25 chars starting with "cm". If it looks like an id, use directly;
  // otherwise treat as a title keyword.
  if (/^c[a-z0-9]{20,}$/i.test(ref)) return ref;
  const project = await prisma.project.findFirst({
    where: { title: { contains: ref } },
    select: { id: true, title: true },
  });
  if (!project) {
    console.error(`project not found for ref: ${ref}`);
    process.exit(1);
  }
  console.log(`resolved "${ref}" -> ${project.id} (${project.title})`);
  return project.id;
}

async function latestContentSize(projectId: string, stage: StageSchemaKey): Promise<number> {
  const row = await prisma.stageOutput.findFirst({
    where: { projectId, stage },
    orderBy: { version: "desc" },
    select: { content: true },
  });
  return row ? JSON.stringify(row.content).length : 0;
}

async function main() {
  const stage = process.argv[2] as StageSchemaKey | undefined;
  const ref = process.argv[3];
  if (!stage || !ref) {
    console.error("usage: tsx scripts/retry-stage.ts <stage> <projectId|titleKeyword>");
    process.exit(1);
  }
  if (!(stage in BYTES_THRESHOLD)) {
    console.error(`unknown stage: ${stage}`);
    process.exit(1);
  }
  const threshold = BYTES_THRESHOLD[stage];
  const projectId = await resolveProjectId(ref);
  const endpoint = `${BASE_URL}/api/stages/${stage}`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const t0 = Date.now();
    let respJson: { ok?: boolean; version?: number; error?: string } | null = null;
    let httpCode = 0;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      httpCode = resp.status;
      const text = await resp.text();
      try {
        respJson = JSON.parse(text);
      } catch {
        respJson = null;
      }
    } catch (e) {
      console.log(`[attempt ${attempt}] fetch error: ${e instanceof Error ? e.message : String(e)}`);
    }

    const ms = Date.now() - t0;
    const okFlag = respJson?.ok === true;
    const err = respJson?.error ?? "(no body)";
    const version = respJson?.version ?? 0;

    const bytes = await latestContentSize(projectId, stage);

    console.log(
      `[attempt ${attempt}] HTTP=${httpCode} time=${ms}ms ok=${okFlag} version=${version} bytes=${bytes} error=${err}`
    );

    if (okFlag && bytes > threshold) {
      console.log(`SUCCESS at attempt ${attempt} (bytes=${bytes}, version=${version})`);
      return;
    }

    if (attempt < MAX_ATTEMPTS) await sleep(SLEEP_MS);
  }

  console.log("FAILED after 6 attempts");
  process.exit(1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
