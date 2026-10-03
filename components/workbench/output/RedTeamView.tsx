import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RedTeam } from "@/lib/schemas";

const ROLE_LABEL: Record<string, string> = {
  algo: "算法",
  eng: "工程",
  design: "设计",
  legal: "法务",
  user: "用户",
};

const SEVERITY_VARIANT = {
  low: "secondary",
  medium: "default",
  high: "destructive",
} as const;

export function RedTeamView({ data }: { data: RedTeam }) {
  return (
    <div className="space-y-4">
      <header>
        <h3 className="text-sm font-semibold">红队评审</h3>
        <p className="text-xs text-muted-foreground">{data.parties.length} 方</p>
      </header>
      <div className="space-y-3">
        {data.parties.map((party, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="text-sm">{ROLE_LABEL[party.role] ?? party.role}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {party.concerns.map((c, j) => (
                <div key={j} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{c.concern}</p>
                    <Badge variant={SEVERITY_VARIANT[c.severity]}>{c.severity}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    依据：{c.evidence}
                  </p>
                  <p className="mt-1 text-xs">
                    <span className="font-medium">改进：</span>{c.fix}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-md border-l-4 border-l-destructive bg-muted/30 p-3">
        <p className="text-xs font-medium">Top 风险</p>
        <ol className="mt-2 space-y-1 text-sm list-decimal pl-5">
          {data.topRisks.map((r, i) => <li key={i}>{r}</li>)}
        </ol>
      </div>

      <div className="rounded-md border-l-4 border-l-primary bg-muted/30 p-3">
        <p className="text-xs font-medium">下一步</p>
        <ol className="mt-2 space-y-1 text-sm list-decimal pl-5">
          {data.nextSteps.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
      </div>
    </div>
  );
}
