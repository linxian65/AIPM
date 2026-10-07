import Link from "next/link";
import { StageNav } from "./StageNav";
import { ChatPane } from "./ChatPane";
import { OutputPane } from "./output/OutputPane";
import type { StageName } from "@/lib/schemas";

type Props = {
  project: { id: string; title: string; brief: string };
  currentStage: StageName;
  completedStages: Set<StageName>;
  currentOutput: unknown | null;
  currentFeedback: unknown | null;
};

export function WorkbenchShell({
  project,
  currentStage,
  completedStages,
  currentOutput,
  currentFeedback,
}: Props) {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b px-6">
        <h1 className="text-sm font-semibold">{project.title}</h1>
        <Link
          href={`/project/${project.id}/export`}
          className="text-sm text-muted-foreground hover:underline"
        >
          导出 Markdown →
        </Link>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 overflow-y-auto border-r p-4">
          <StageNav
            projectId={project.id}
            currentStage={currentStage}
            completedStages={completedStages}
          />
        </aside>
        <section className="flex-1 overflow-y-auto border-r p-6">
          <ChatPane
            projectId={project.id}
            brief={project.brief}
            currentStage={currentStage}
            currentOutput={currentOutput}
            currentFeedback={currentFeedback}
          />
        </section>
        <section className="w-[480px] overflow-y-auto p-6">
          <OutputPane currentStage={currentStage} output={currentOutput} />
        </section>
      </div>
    </div>
  );
}
