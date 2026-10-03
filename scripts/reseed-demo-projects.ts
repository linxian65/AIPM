// Recreate the 3 [Demo] projects from the JSON presets, mirroring demo page logic.
// Useful after cleanup-demo-projects wipes them.
import { prisma } from "../lib/db";
import ecomReturn from "../lib/presets/ecom-return.json";
import docQa from "../lib/presets/doc-qa.json";
import salesEmail from "../lib/presets/sales-email.json";

const PRESETS = {
  "ecom-return": ecomReturn,
  "doc-qa": docQa,
  "sales-email": salesEmail,
} as const;

async function main() {
  for (const [slug, payload] of Object.entries(PRESETS)) {
    const preset = await prisma.presetCase.findUnique({ where: { slug } });
    if (!preset) {
      console.error(`preset ${slug} not found in DB`);
      process.exit(1);
    }
    const title = `[Demo] ${preset.title}`;

    // Idempotent
    const existing = await prisma.project.findFirst({
      where: { title },
      select: { id: true },
    });
    if (existing) {
      console.log(`[${slug}] reuse existing ${existing.id} (${title})`);
      continue;
    }

    const project = await prisma.project.create({
      data: {
        title,
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
    console.log(`[${slug}] created ${project.id} (${title})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
