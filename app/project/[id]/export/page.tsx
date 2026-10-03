import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { buildMarkdown } from "@/lib/export/buildMarkdown";
import { MarkdownSource } from "@/components/export/MarkdownSource";
import { MarkdownPreview } from "@/components/export/MarkdownPreview";
import type { StageName } from "@/lib/schemas";

type Params = { params: { id: string } };

export default async function ExportPage({ params }: Params) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { outputs: { orderBy: { createdAt: "desc" } } },
  });

  if (!project) notFound();

  const latestByStage: Partial<Record<StageName, unknown>> = {};
  for (const o of project.outputs) {
    if (!(o.stage in latestByStage)) {
      latestByStage[o.stage as StageName] = o.content;
    }
  }

  const markdown = buildMarkdown(
    { title: project.title, brief: project.brief },
    latestByStage
  );

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b px-6">
        <div className="flex items-center gap-4">
          <Link
            href={`/project/${project.id}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            ← 返回工作台
          </Link>
          <h1 className="text-sm font-semibold">{project.title} · 导出</h1>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <section className="w-1/2 overflow-hidden border-r">
          <MarkdownSource markdown={markdown} />
        </section>
        <section className="w-1/2 overflow-auto p-8">
          <MarkdownPreview markdown={markdown} />
        </section>
      </div>
    </div>
  );
}