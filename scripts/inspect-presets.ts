import { prisma } from "../lib/db";

async function main() {
  const presets = await prisma.presetCase.findMany({ orderBy: { slug: "asc" } });
  console.log(`[presets] ${presets.length}:`);
  for (const p of presets) console.log(`  ${p.slug.padEnd(15)} ${p.title}  brief=${p.brief.slice(0, 30)}...`);

  const demoProjects = await prisma.project.findMany({
    where: { title: { startsWith: "[Demo]" } },
    include: { _count: { select: { outputs: true } } },
  });
  console.log(`\n[demo projects] ${demoProjects.length}:`);
  for (const p of demoProjects) console.log(`  ${p.id}  ${p.title}  outputs=${p._count.outputs}`);
}

main().finally(() => prisma.$disconnect());
