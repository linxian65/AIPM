// Export a project's 5 stages to JSON, picking the latest non-fallback version per stage.
// Usage: tsx scripts/export-preset.ts <projectId|titleKeyword> <outputPath>

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { prisma } from "../lib/db";
import { buildFallback } from "../lib/ai/fallback";
import type { StageSchemaKey } from "../lib/schemas";

const STAGES: StageSchemaKey[] = ["clarify", "feature", "solution", "eval", "redteam"];

function isFallback(stage: StageSchemaKey, content: unknown): boolean {
  try {
    return JSON.stringify(content) === JSON.stringify(buildFallback(stage));
  } catch {
    return false;
  }
}

async function resolveProjectId(ref: string): Promise<{ id: string; title: string }> {
  if (/^c[a-z0-9]{20,}$/i.test(ref)) {
    const p = await prisma.project.findUnique({
      where: { id: ref },
      select: { id: true, title: true },
    });
    if (p) return p;
  }
  const p = await prisma.project.findFirst({
    where: { title: { contains: ref } },
    select: { id: true, title: true },
  });
  if (!p) {
    console.error(`project not found for ref: ${ref}`);
    process.exit(1);
  }
  return p;
}

async function main() {
  const ref = process.argv[2];
  const outPath = process.argv[3];
  if (!ref || !outPath) {
    console.error("usage: tsx scripts/export-preset.ts <projectId|titleKeyword> <outputPath>");
    process.exit(1);
  }

  const project = await resolveProjectId(ref);
  console.log(`project: ${project.id} (${project.title})`);

  const all = await prisma.stageOutput.findMany({
    where: { projectId: project.id },
    orderBy: [{ stage: "asc" }, { version: "desc" }],
  });

  // Print full version inventory before filtering.
  for (const o of all) {
    const bytes = Buffer.byteLength(JSON.stringify(o.content), "utf8");
    const fb = isFallback(o.stage as StageSchemaKey, o.content);
    console.log(`${o.stage} v${o.version}: ${bytes} bytes${fb ? " [FALLBACK]" : ""}`);
  }

  const stages: Record<string, unknown> = {};
  const stageCounts: Record<string, number> = {};
  for (const stage of STAGES) {
    const candidates = all.filter((o) => o.stage === stage);
    stageCounts[stage] = candidates.length;
    const picked = candidates.find((o) => !isFallback(stage, o.content));
    if (!picked) continue;
    stages[stage] = picked.content;
  }

  const missing = STAGES.filter((s) => !(s in stages));
  if (missing.length > 0) {
    console.error(`missing stages (no non-fallback version): ${missing.join(", ")}`);
    console.error(`per-stage version counts: ${JSON.stringify(stageCounts)}`);
    process.exit(1);
  }

  mkdirSync(dirname(outPath), { recursive: true });
  const payload = { stages };
  writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");

  const totalBytes = Buffer.byteLength(JSON.stringify(payload), "utf8");
  console.log(`Exported 5 stages to ${outPath}`);
  console.log(`  per-stage bytes: ${STAGES.map((s) => `${s}=${Buffer.byteLength(JSON.stringify(stages[s]), "utf8")}`).join(", ")}`);
  console.log(`  total bytes: ${totalBytes}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
