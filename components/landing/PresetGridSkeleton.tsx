import {
  Card,
  CardHeader,
  CardContent,
} from "@/components/ui/card";

export function PresetGridSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <Card key={i} className="h-full">
          <CardHeader>
            <div className="h-5 w-2/3 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}