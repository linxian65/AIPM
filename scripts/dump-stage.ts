// Dump all versions for a projectId+stage with concise shape summary.
import { prisma } from "../lib/db";
import { Stage } from "@prisma/client";

async function main() {
  const projectId = process.argv[2];
  const stage = process.argv[3] as Stage;
  if (!projectId || !stage) {
    console.error("usage: dump-stage <projectId> <stage>");
    process.exit(1);
  }
  const all = await prisma.stageOutput.findMany({
    where: { projectId, stage },
    orderBy: { version: "asc" },
  });
  console.log(`total rows: ${all.length}`);
  for (const o of all) {
    const c = o.content as Record<string, unknown> | null;
    const parties = Array.isArray(c?.parties) ? (c!.parties as unknown[]).length : 0;
    const topRisks = Array.isArray(c?.topRisks) ? (c!.topRisks as unknown[]).length : 0;
    const nextSteps = Array.isArray(c?.nextSteps) ? (c!.nextSteps as unknown[]).length : 0;
    const offlineCases = Array.isArray(c?.offlineCases) ? (c!.offlineCases as unknown[]).length : 0;
    const onlineMetrics = Array.isArray(c?.onlineMetrics) ? (c!.onlineMetrics as unknown[]).length : 0;
    const badCases = Array.isArray(c?.badCases) ? (c!.badCases as unknown[]).length : 0;
    const launchGates = Array.isArray(c?.launchGates) ? (c!.launchGates as unknown[]).length : 0;
    const sizeBytes = JSON.stringify(c).length;
    console.log(
      `v${o.version} parties=${parties} topRisks=${topRisks} nextSteps=${nextSteps} ` +
        `offlineCases=${offlineCases} onlineMetrics=${onlineMetrics} badCases=${badCases} launchGates=${launchGates} ` +
        `bytes=${sizeBytes} ${o.createdAt.toISOString()}`
    );
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
