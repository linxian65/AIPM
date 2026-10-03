import type { StageName } from "@/lib/schemas";

const STAGE_LABEL: Record<StageName, string> = {
  clarify: "引导追问",
  feature: "功能定义卡",
  solution: "方案对比",
  eval: "评估方案",
  redteam: "红队评审",
};

export function EmptyState({ stage }: { stage: StageName }) {
  return (
    <div className="flex h-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
      点击中间栏的 &ldquo;生成&rdquo; 按钮，输出 {STAGE_LABEL[stage]}
    </div>
  );
}
