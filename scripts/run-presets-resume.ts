// Continuation: for each preset, run stages that aren't already OK at v1+,
// export JSON. Resilient to per-stage failures.

import { mkdir, writeFile } from "node:fs/promises";
import { prisma } from "../lib/db";
import { runStageForProject } from "../lib/ai/runStageForProject";

const SLUGS = ["ecom-return", "doc-qa", "sales-email"];
const STAGES = ["clarify", "feature", "solution", "eval", "redteam"] as const;
const OUT_DIR = "scripts/runs-presets";

type Row = {
  slug: string;
  projectId: string;
  stage: string;
  ok: boolean;
  version: number;
  ms: number;
  error?: string;
  skipped?: boolean;
};

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");
  await mkdir(OUT_DIR, { recursive: true });

  const rows: Row[] = [];

  for (const slug of SLUGS) {
    const preset = await prisma.presetCase.findUnique({ where: { slug } });
    if (!preset) throw new Error(`preset ${slug} not found`);

    let project = await prisma.project.findFirst({
      where: { title: `[Demo] ${preset.title}` },
    });
    if (!project) {
      project = await prisma.project.create({
        data: { title: `[Demo] ${preset.title}`, brief: preset.brief, currentStage: "clarify" },
      });
      console.log(`[${slug}] created project ${project.id}`);
    } else {
      console.log(`[${slug}] reusing project ${project.id}`);
    }

    // Check existing latest versions per stage
    const existing = await prisma.stageOutput.findMany({
      where: { projectId: project.id },
      orderBy: { version: "desc" },
    });
    const latestByStage = new Map<string, { version: number; okMarker: boolean }>();
    for (const o of existing) {
      if (!latestByStage.has(o.stage)) {
        // Heuristic: content length > 1000 suggests real (not fallback); fallback is short
        const len = JSON.stringify(o.content).length;
        latestByStage.set(o.stage, { version: o.version, okMarker: len > 1000 });
      }
    }

    for (const stage of STAGES) {
      const existing = latestByStage.get(stage);
      if (existing && existing.okMarker) {
        console.log(`  [${slug}] ${stage.padEnd(8)} SKIP  v=${existing.version} (already has real output)`);
        rows.push({ slug, projectId: project.id, stage, ok: true, version: existing.version, ms: 0, skipped: true });
        continue;
      }

      const t0 = Date.now();
      try {
        const r = await runStageForProject(project.id, stage);
        const ms = Date.now() - t0;
        const err = r.ok ? undefined : r.error?.split("\n")[0];
        rows.push({ slug, projectId: project.id, stage, ok: r.ok, version: r.version ?? 0, ms, error: err });
        console.log(
          `  [${slug}] ${stage.padEnd(8)} ${r.ok ? "OK " : "FB "} v=${r.version} ${ms}ms${err ? "  " + err.slice(0, 60) : ""}`
        );
      } catch (e) {
        const ms = Date.now() - t0;
        const msg = e instanceof Error ? e.message : String(e);
        rows.push({ slug, projectId: project.id, stage, ok: false, version: 0, ms, error: msg });
        console.log(`  [${slug}] ${stage.padEnd(8)} ERR  ${ms}ms  ${msg.slice(0, 80)}`);
      }
    }

    // export JSON
    const outputs = await prisma.stageOutput.findMany({
      where: { projectId: project.id },
      orderBy: { version: "desc" },
    });
    const stagesOut: Record<string, unknown> = {};
    for (const o of outputs) if (!(o.stage in stagesOut)) stagesOut[o.stage] = o.content;
    const jsonPath = `${OUT_DIR}/${slug}.json`;
    await writeFile(jsonPath, JSON.stringify({ slug, title: preset.title, brief: preset.brief, stages: stagesOut }, null, 2), "utf8");
    console.log(`  [${slug}] exported ${jsonPath}\n`);
  }

  console.log("\n=== summary ===");
  console.log("slug".padEnd(15) + "stage".padEnd(10) + "ok".padEnd(4) + "ver".padEnd(4) + "ms".padEnd(8) + "skipped");
  for (const r of rows) {
    console.log(
      r.slug.padEnd(15) +
        r.stage.padEnd(10) +
        (r.ok ? "OK" : "FB").padEnd(4) +
        String(r.version).padEnd(4) +
        String(r.ms).padEnd(8) +
        (r.skipped ? "yes" : "no")
    );
  }
  const ran = rows.filter((r) => !r.skipped);
  const ok = ran.filter((r) => r.ok).length;
  console.log(`\n[stats] ran=${ran.length} ok=${ok} (${ran.length > 0 ? ((ok / ran.length) * 100).toFixed(1) : "0"}%)`);
  console.log(`[stats] total wall time (incl. skipped): ${(rows.reduce((s, r) => s + r.ms, 0) / 1000).toFixed(1)}s`);
  console.log(`[stats] total wall time (excl. skipped): ${(ran.reduce((s, r) => s + r.ms, 0) / 1000).toFixed(1)}s`);

  await writeFile(`${OUT_DIR}/_summary.json`, JSON.stringify(rows, null, 2), "utf8");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
