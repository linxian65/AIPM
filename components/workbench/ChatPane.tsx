import type { ReactNode } from "react";
import type { StageName } from "@/lib/schemas";
import { ClarifySchema, SolutionSchema } from "@/lib/schemas";
import { GenerateButton } from "./GenerateButton";
import { ClarifyFeedbackForm } from "./ClarifyFeedbackForm";
import { SolutionFeedbackForm } from "./SolutionFeedbackForm";

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
  currentFeedback: unknown | null;
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
  const solutionParsed =
    currentStage === "solution" && currentOutput
      ? SolutionSchema.safeParse(currentOutput)
      : null;

  let formArea: ReactNode;
  if (clarifyParsed?.success) {
    formArea = (
      <ClarifyFeedbackForm
        projectId={projectId}
        questions={clarifyParsed.data.questions}
      />
    );
  } else if (solutionParsed?.success) {
    formArea = (
      <SolutionFeedbackForm
        projectId={projectId}
        options={solutionParsed.data.options}
      />
    );
  } else {
    formArea = <GenerateButton projectId={projectId} stage={currentStage} />;
  }

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

      {formArea}
    </div>
  );
}
