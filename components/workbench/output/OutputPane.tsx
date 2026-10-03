import { StageContentSchema, type StageName } from "@/lib/schemas";
import { EmptyState } from "./EmptyState";
import { ClarifyView } from "./ClarifyView";
import { FeatureView } from "./FeatureView";
import { SolutionView } from "./SolutionView";
import { EvalView } from "./EvalView";
import { RedTeamView } from "./RedTeamView";

type Props = { currentStage: StageName; output: unknown | null };

export function OutputPane({ currentStage, output }: Props) {
  if (!output) return <EmptyState stage={currentStage} />;

  const parsed = StageContentSchema.safeParse({
    stage: currentStage,
    content: output,
  });

  if (!parsed.success) {
    return (
      <pre className="overflow-x-auto rounded-md border bg-muted/30 p-4 text-xs">
        {JSON.stringify(output, null, 2)}
      </pre>
    );
  }

  switch (parsed.data.stage) {
    case "clarify":
      return <ClarifyView data={parsed.data.content} />;
    case "feature":
      return <FeatureView data={parsed.data.content} />;
    case "solution":
      return <SolutionView data={parsed.data.content} />;
    case "eval":
      return <EvalView data={parsed.data.content} />;
    case "redteam":
      return <RedTeamView data={parsed.data.content} />;
  }
}
