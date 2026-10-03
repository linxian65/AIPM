// One-shot orchestration: run all 5 stages for each preset, export JSON, collect stats.
// Does NOT modify any source code; creates temp scripts/runs-presets/* output.

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
  inputTokens?: number;
  outputTokens?: number;
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

    for (const stage of STAGES) {
      const t0 = Date.now();
      const r = await runStageForProject(project.id, stage);
      const ms = Date.now() - t0;
      const err = r.ok ? undefined : r.error?.split("\n")[0];
      rows.push({
        slug,
        projectId: project.id,
        stage,
        ok: r.ok,
        version: r.version ?? 0,
        ms,
        error: err,
      });
      console.log(
        `  [${slug}] ${stage.padEnd(8)} ${r.ok ? "OK " : "FB "} v=${r.version} ${ms}ms${err ? "  " + err.slice(0, 60) : ""}`
      );
    }

    // export to JSON
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

  // summary table
  console.log("\n=== summary ===");
  console.log("slug".padEnd(15) + "stage".padEnd(10) + "ok".padEnd(4) + "version".padEnd(8) + "ms");
  for (const r of rows) {
    console.log(
      r.slug.padEnd(15) +
        r.stage.padEnd(10) +
        (r.ok ? "OK" : "FB").padEnd(4) +
        String(r.version).padEnd(8) +
        String(r.ms)
    );
  }
  const total = rows.length;
  const ok = rows.filter((r) => r.ok).length;
  console.log(`\n[stats] ok=${ok}/${total} (${((ok / total) * 100).toFixed(1)}%)`);
  console.log(`[stats] total wall time: ${(rows.reduce((s, r) => s + r.ms, 0) / 1000).toFixed(1)}s`);

  await writeFile(`${OUT_DIR}/_summary.json`, JSON.stringify(rows, null, 2), "utf8");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
