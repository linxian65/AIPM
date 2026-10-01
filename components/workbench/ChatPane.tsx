import { Button } from "@/components/ui/button";
import type { StageName } from "@/lib/schemas";

const STAGE_TITLE: Record<StageName, string> = {
  clarify: "引导追问",
  feature: "功能定义卡",
  solution: "方案对比",
  eval: "评估方案",
  redteam: "红队评审",
};

type Props = { brief: string; currentStage: StageName };

export function ChatPane({ brief, currentStage }: Props) {
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

      <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        C 阶段接入：点击下方按钮调用 runStage
      </div>

      <Button disabled>生成（C 阶段启用）</Button>
    </div>
  );
}