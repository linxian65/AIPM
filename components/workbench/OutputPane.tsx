import type { StageName } from "@/lib/schemas";

type Props = { currentStage: StageName; output: unknown | null };

export function OutputPane({ currentStage, output }: Props) {
  if (!output) {
    return (
      <div className="flex h-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        尚未生成 {currentStage} 产物
      </div>
    );
  }

  return (
    <pre className="overflow-x-auto rounded-md border bg-muted/30 p-4 text-xs">
      {JSON.stringify(output, null, 2)}
    </pre>
  );
}