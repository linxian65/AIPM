import type { StageName } from "@/lib/schemas";
import { ClarifySchema } from "@/lib/schemas";
import { GenerateButton } from "./GenerateButton";
import { ClarifyFeedbackForm } from "./ClarifyFeedbackForm";

const STAGE_TITLE: Record<StageName, string> = {
  clarify: "引导追问",
  feature: "功能定义卡",
  solution: "方案对比",
  eval: "评估方案",
  redteam: "红队评审",
};

type Props = {
  projectId: string;
  brief: string;
  currentStage: StageName;
  currentOutput: unknown | null;
};

export function ChatPane({
  projectId,
  brief,
  currentStage,
  currentOutput,
}: Props) {
  const clarifyParsed =
    currentStage === "clarify" && currentOutput
      ? ClarifySchema.safeParse(currentOutput)
      : null;
  const showClarifyForm = clarifyParsed?.success === true;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{STAGE_TITLE[currentStage]}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          当前阶段：{currentStage}
        </p>
      </div>

      <div className="rounded-md border bg-muted/30 p-4">
        <p className="text-xs font-medium text-muted-foreground">原始需求</p>
        <p className="mt-2 text-sm">{brief}</p>
      </div>

      {showClarifyForm ? (
        <ClarifyFeedbackForm
          projectId={projectId}
          questions={clarifyParsed.data.questions}
        />
      ) : (
        <GenerateButton projectId={projectId} stage={currentStage} />
      )}
    </div>
  );
}
