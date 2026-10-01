import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function PresetCard({
  preset,
}: {
  preset: { slug: string; title: string; brief: string; domain: string };
}) {
  return (
    <Link href={`/project/demo/${preset.slug}`}>
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-lg">{preset.title}</CardTitle>
            <Badge variant="secondary">{preset.domain}</Badge>
          </div>
          <CardDescription className="line-clamp-3">
            {preset.brief}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            点击查看完整案例 →
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}