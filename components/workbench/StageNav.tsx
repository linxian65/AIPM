import Link from "next/link";
import { cn } from "@/lib/utils";
import { StageBadge } from "./StageBadge";
import type { StageName } from "@/lib/schemas";

const STAGES: { key: StageName; label: string; desc: string }[] = [
  { key: "clarify", label: "引导追问", desc: "澄清需求与约束" },
  { key: "feature", label: "功能定义", desc: "定义 AI 功能卡" },
  { key: "solution", label: "方案对比", desc: "比较技术方案" },
  { key: "eval", label: "评估方案", desc: "设计评估与门槛" },
  { key: "redteam", label: "红队评审", desc: "五方风险挑战" },
];

type Props = {
  projectId: string;
  currentStage: StageName;
  completedStages: Set<StageName>;
};

export function StageNav({ projectId, currentStage, completedStages }: Props) {
  return (
    <nav className="space-y-1">
      {STAGES.map((s, i) => {
        const isCurrent = s.key === currentStage;
        const isCompleted = completedStages.has(s.key);
        return (
          <Link
            key={s.key}
            href={`/project/${projectId}?stage=${s.key}`}
            className={cn(
              "block rounded-md px-3 py-2 transition-colors",
              isCurrent
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/50",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {i + 1}. {s.label}
              </span>
              <StageBadge isCurrent={isCurrent} isCompleted={isCompleted} />
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{s.desc}</p>
          </Link>
        );
      })}
    </nav>
  );
}