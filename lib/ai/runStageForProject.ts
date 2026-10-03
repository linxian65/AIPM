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

export async function runStageForProject(projectId: string, stage: StageName) {
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
      if (!(o.stage in previousOutputs)) previousOutputs[o.stage] = o.content;
    }
  }

  const result = await runStage({
    stage: stage as StageSchemaKey,
    brief: project.brief,
    previousOutputs,
  });

  const content = result.ok ? result.data : result.fallback;
  const nextVersion = await prisma.$transaction(async (tx) => {
    const max = await tx.stageOutput.aggregate({
      where: { projectId, stage },
      _max: { version: true },
    });
    const version = (max._max.version ?? 0) + 1;
    await tx.stageOutput.create({
      data: { projectId, stage, content: content as object, version },
    });
    // 成功后推进 currentStage
    if (result.ok) {
      await tx.project.update({
        where: { id: projectId },
        data: { currentStage: stage },
      });
    }
    return version;
  });

  return {
    ok: result.ok,
    data: result.ok ? result.data : null,
    fallback: result.ok ? null : result.fallback,
    error: result.ok ? null : result.error,
    version: nextVersion,
  };
}