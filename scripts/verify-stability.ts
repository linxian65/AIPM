import { prisma } from "../lib/db";
import { runStageForProject } from "../lib/ai/runStageForProject";

const STAGES = ["clarify", "feature"] as const;
const RUNS_PER_STAGE = 5;

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not set");
  }

  const project = await prisma.project.create({
    data: {
      title: "verify-stability",
      brief:
        "电商客服退换货 Agent：用户咨询订单状态与退换货时自动查询订单系统、判断是否符合政策并生成处理动作，复杂场景转人工。",
    },
  });
  console.log(`[setup] project ${project.id}\n`);

  const results: Record<string, { ok: number; fail: number }> = {
    clarify: { ok: 0, fail: 0 },
    feature: { ok: 0, fail: 0 },
  };

  for (const stage of STAGES) {
    console.log(`=== ${stage} ===`);
    for (let i = 1; i <= RUNS_PER_STAGE; i++) {
      const t0 = Date.now();
      const r = await runStageForProject(project.id, stage);
      const ms = Date.now() - t0;
      const ok = r.ok;
      results[stage][ok ? "ok" : "fail"]++;
      const errShort = !ok && r.error ? r.error.split("\n")[0].slice(0, 80) : "";
      console.log(
        `  run ${i}/5  ${ok ? "OK " : "FAIL"}  ${ms}ms  v=${r.version ?? "-"}  ${errShort}`
      );
      if (!ok && r.error) console.log(`    err: ${r.error}`);
    }
    console.log("");
  }

  console.log("=== summary ===");
  for (const stage of STAGES) {
    const { ok, fail } = results[stage];
    console.log(`  ${stage.padEnd(8)} ${ok}/${RUNS_PER_STAGE}`);
  }

  await prisma.stageOutput.deleteMany({ where: { projectId: project.id } });
  await prisma.project.delete({ where: { id: project.id } });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
