import { Badge } from "@/components/ui/badge";
import type { Clarify } from "@/lib/schemas";

const PRIORITY_VARIANT = {
  high: "destructive",
  medium: "default",
  low: "secondary",
} as const;

export function ClarifyView({ data }: { data: Clarify }) {
  return (
    <div className="space-y-4">
      <header>
        <h3 className="text-sm font-semibold">引导追问</h3>
        <p className="text-xs text-muted-foreground">{data.questions.length} 条</p>
      </header>
      <ol className="space-y-3">
        {data.questions.map((q, i) => (
          <li key={i} className="rounded-md border p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium">{q.question}</p>
              <Badge variant={PRIORITY_VARIANT[q.priority]}>{q.priority}</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{q.rationale}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
