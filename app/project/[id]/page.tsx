import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { StageEnum, type StageName } from "@/lib/schemas";
import { WorkbenchShell } from "@/components/workbench/WorkbenchShell";

type Params = { params: { id: string }; searchParams: { stage?: string } };

export default async function ProjectPage({ params, searchParams }: Params) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { outputs: { orderBy: { createdAt: "desc" } } },
  });

  if (!project) notFound();

  const stageParse = StageEnum.safeParse(searchParams.stage);
  const currentStage: StageName = stageParse.success
    ? stageParse.data
    : project.currentStage;

  const latestByStage = new Map<
    StageName,
    { content: unknown; feedback: unknown | null }
  >();
  for (const o of project.outputs) {
    if (!latestByStage.has(o.stage)) {
      latestByStage.set(o.stage, { content: o.content, feedback: o.feedback });
    }
  }

  const completedStages = new Set(latestByStage.keys());
  const currentEntry = latestByStage.get(currentStage);

  return (
    <WorkbenchShell
      project={{ id: project.id, title: project.title, brief: project.brief }}
      currentStage={currentStage}
      completedStages={completedStages}
      currentOutput={currentEntry?.content ?? null}
      currentFeedback={currentEntry?.feedback ?? null}
    />
  );
}
