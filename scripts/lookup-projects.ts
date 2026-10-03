// One-shot lookup: print project IDs for doc-qa and sales-email preset projects.
import { prisma } from "../lib/db";

async function main() {
  const projects = await prisma.project.findMany({
    where: { title: { startsWith: "[Demo] " } },
    select: { id: true, title: true, currentStage: true },
    orderBy: { createdAt: "asc" },
  });
  for (const p of projects) console.log(`${p.id}\t${p.currentStage}\t${p.title}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
