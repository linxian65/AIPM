import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const demos = await prisma.project.findMany({
    where: { title: { startsWith: "[Demo]" } },
    select: { id: true, title: true, _count: { select: { outputs: true } } },
  });

  if (demos.length === 0) {
    console.log("No [Demo] projects found.");
    return;
  }

  console.log(`Found ${demos.length} [Demo] project(s):`);
  for (const d of demos) {
    console.log(`  ${d.id}  ${d.title}  (${d._count.outputs} outputs)`);
  }

  const result = await prisma.project.deleteMany({
    where: { title: { startsWith: "[Demo]" } },
  });
  console.log(`Deleted ${result.count} project(s), cascade removed all StageOutput rows.`);
}

main().finally(() => prisma.$disconnect());
