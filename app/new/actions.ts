"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createProjectSchema } from "@/lib/schemas/project";

export type CreateProjectState = {
  errors?: {
    title?: string[];
    brief?: string[];
    _form?: string[];
  };
};

export async function createProject(
  _prevState: CreateProjectState,
  formData: FormData
): Promise<CreateProjectState> {
  const raw = {
    title: formData.get("title"),
    brief: formData.get("brief"),
  };

  const parsed = createProjectSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  let projectId: string;
  try {
    const project = await prisma.project.create({
      data: {
        title: parsed.data.title,
        brief: parsed.data.brief,
        currentStage: "clarify",
      },
      select: { id: true },
    });
    projectId = project.id;
  } catch (err) {
    console.error("[createProject] DB error", err);
    return { errors: { _form: ["创建失败，请稍后重试。"] } };
  }

  redirect(`/project/${projectId}`);
}