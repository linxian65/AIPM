import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Feature } from "@/lib/schemas";

export function FeatureView({ data }: { data: Feature }) {
  return (
    <div className="space-y-4">
      <header>
        <h3 className="text-sm font-semibold">功能定义卡</h3>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{data.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{data.oneLiner}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldList label="输入" items={data.inputs} />
          <FieldList label="输出" items={data.outputs} />
          <FieldList label="成功标准" items={data.successCriteria} />
          <FieldList label="非目标" items={data.nonGoals} variant="secondary" />
        </CardContent>
      </Card>
    </div>
  );
}

function FieldList({
  label,
  items,
  variant = "default",
}: {
  label: string;
  items: string[];
  variant?: "default" | "secondary";
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
      <ul className="space-y-1">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Badge variant={variant} className="mt-0.5 shrink-0">·</Badge>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
