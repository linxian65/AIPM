import { prisma } from "@/lib/db";
import { PresetCard } from "./PresetCard";

export async function PresetGrid() {
  const presets = await prisma.presetCase.findMany({
    orderBy: { createdAt: "asc" },
    take: 3,
  });

  if (presets.length === 0) {
    return (
      <p className="text-muted-foreground">暂无预置案例。</p>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {presets.map((p) => (
        <PresetCard
          key={p.id}
          preset={{
            slug: p.slug,
            title: p.title,
            brief: p.brief,
            domain: p.domain,
          }}
        />
      ))}
    </div>
  );
}