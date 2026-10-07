import { prisma } from "@/lib/db";
import { runStage } from "./runStage";
import type { StageName, StageSchemaKey } from "@/lib/schemas";

const STAGE_ORDER: StageName[] = ["clarify", "feature", "solution", "eval", "redteam"];

const PREVIOUS_STAGES: Record<StageName, StageName[]> = {
  clarify: [],
  feature: ["clarify"],
  solution: ["clarify", "feature"],
  eval: ["clarify", "feature", "solution"],
  redteam: ["clarify", "feature", "solution", "eval"],
};

export async function runStageForProject(
  projectId: string,
  stage: StageName,
  userFeedback?: unknown
) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { ok: false as const, error: "PROJECT_NOT_FOUND" };

  // 读前序产物
  const previousOutputs: Record<string, unknown> = {};
  if (PREVIOUS_STAGES[stage].length > 0) {
    const outputs = await prisma.stageOutput.findMany({
      where: { projectId, stage: { in: PREVIOUS_STAGES[stage] } },
      orderBy: { version: "desc" },
    });
    for (const o of outputs) {
      if (!(o.stage in previousOutputs)) {
        previousOutputs[o.stage] = o.content;
        if (o.feedback) {
          previousOutputs[`${o.stage}_feedback`] = o.feedback;
        }
      }
    }
  }

  const result = await runStage({
    stage: stage as StageSchemaKey,
    brief: project.brief,
    previousOutputs,
    userFeedback,
  });

  const content = result.ok ? result.data : result.fallback;
  // Neon pooler 不支持跨语句的交互式事务（prisma.$transaction），
  // 拆成三个独立调用：aggregate 取最大 version → create 写入 → update 推进 currentStage。
  // 代价：create 成功但 update 失败时 currentStage 落后一拍，下一轮会自然修正。
  const max = await prisma.stageOutput.aggregate({
    where: { projectId, stage },
    _max: { version: true },
  });
  const nextVersion = (max._max.version ?? 0) + 1;
  await prisma.stageOutput.create({
    data: {
      projectId,
      stage,
      content: content as object,
      feedback: (userFeedback as object) ?? undefined,
      version: nextVersion,
    },
  });
  // 成功后推进 currentStage
  if (result.ok) {
    await prisma.project.update({
      where: { id: projectId },
      data: { currentStage: stage },
    });
  }

  return {
    ok: result.ok,
    data: result.ok ? result.data : null,
    fallback: result.ok ? null : result.fallback,
    error: result.ok ? null : result.error,
    version: nextVersion,
  };
}
