import { NextResponse } from "next/server";
import { z } from "zod";
import { runStageForProject } from "@/lib/ai/runStageForProject";

const bodySchema = z.object({ projectId: z.string().min(1) });

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }

  const result = await runStageForProject(parsed.data.projectId, "redteam");

  if ("error" in result && result.error === "PROJECT_NOT_FOUND") {
    return NextResponse.json({ ok: false, error: "PROJECT_NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json(result);
}
