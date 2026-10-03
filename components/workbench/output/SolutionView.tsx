import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Solution } from "@/lib/schemas";

const COMPLEXITY_VARIANT = {
  low: "secondary",
  medium: "default",
  high: "destructive",
} as const;

export function SolutionView({ data }: { data: Solution }) {
  return (
    <div className="space-y-4">
      <header>
        <h3 className="text-sm font-semibold">方案对比</h3>
        <p className="text-xs text-muted-foreground">{data.options.length} 个方案</p>
      </header>
      <div className="space-y-3">
        {data.options.map((opt, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{opt.name}</CardTitle>
                <Badge variant={COMPLEXITY_VARIANT[opt.complexity]}>
                  {opt.complexity}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="mb-1 text-xs font-medium text-emerald-600">优点</p>
                <ul className="list-disc pl-5 space-y-0.5">
                  {opt.pros.map((p, j) => <li key={j}>{p}</li>)}
                </ul>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-red-600">缺点</p>
                <ul className="list-disc pl-5 space-y-0.5">
                  {opt.cons.map((c, j) => <li key={j}>{c}</li>)}
                </ul>
              </div>
              <p className="text-xs text-muted-foreground">{opt.fit}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="rounded-md border-l-4 border-l-primary bg-muted/30 p-3">
        <p className="text-xs font-medium">推荐</p>
        <p className="mt-1 text-sm">{data.recommendation}</p>
      </div>
    </div>
  );
}
