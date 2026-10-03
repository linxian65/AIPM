import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import ecomReturn from "@/lib/presets/ecom-return.json";
import docQa from "@/lib/presets/doc-qa.json";
import salesEmail from "@/lib/presets/sales-email.json";

const PRESETS = {
  "ecom-return": ecomReturn,
  "doc-qa": docQa,
  "sales-email": salesEmail,
} as const;

type PresetSlug = keyof typeof PRESETS;

type Params = { params: { slug: string } };

export default async function DemoPage({ params }: Params) {
  const preset = await prisma.presetCase.findUnique({
    where: { slug: params.slug },
  });
  if (!preset) notFound();

  const slug = params.slug as PresetSlug;
  const payload = PRESETS[slug];
  if (!payload) notFound();

  // 幂等：已存在同名 demo project 直接跳转
  const existing = await prisma.project.findFirst({
    where: { title: `[Demo] ${preset.title}` },
    select: { id: true },
  });
  if (existing) redirect(`/project/${existing.id}`);

  // 一次创建 project + 5 条 StageOutput
  const project = await prisma.project.create({
    data: {
      title: `[Demo] ${preset.title}`,
      brief: preset.brief,
      currentStage: "redteam",
      outputs: {
        create: Object.entries(payload.stages).map(([stage, content]) => ({
          stage: stage as "clarify" | "feature" | "solution" | "eval" | "redteam",
          content: content as object,
          version: 1,
        })),
      },
    },
    select: { id: true },
  });

  redirect(`/project/${project.id}`);
}
