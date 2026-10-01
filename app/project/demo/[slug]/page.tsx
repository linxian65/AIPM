import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";

type Params = { params: { slug: string } };

export default async function DemoPage({ params }: Params) {
  const preset = await prisma.presetCase.findUnique({
    where: { slug: params.slug },
  });

  if (!preset) notFound();

  const existing = await prisma.project.findFirst({
    where: { title: `[Demo] ${preset.title}` },
  });

  if (existing) redirect(`/project/${existing.id}`);

  const created = await prisma.project.create({
    data: {
      title: `[Demo] ${preset.title}`,
      brief: preset.brief,
      currentStage: "clarify",
    },
    select: { id: true },
  });

  redirect(`/project/${created.id}`);
}