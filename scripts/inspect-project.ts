import { prisma } from "../lib/db";

async function main() {
  const id = "cmur5w3go0000usnkb3akocjz";
  const p = await prisma.project.findUnique({
    where: { id },
    include: { outputs: { orderBy: [{ stage: "asc" }, { version: "desc" }] } },
  });
  if (!p) {
    console.log("project not found");
    return;
  }
  console.log(JSON.stringify({
    title: p.title,
    brief: p.brief.slice(0, 30),
    currentStage: p.currentStage,
    outputs: p.outputs.map((o) => ({
      stage: o.stage,
      version: o.version,
      contentSample: JSON.stringify(o.content).slice(0, 80),
    })),
  }, null, 2));
}

main().finally(() => prisma.$disconnect());
