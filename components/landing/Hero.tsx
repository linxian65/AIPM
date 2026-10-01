import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="border-b bg-gradient-to-b from-background to-muted/40">
      <div className="container flex flex-col items-center gap-6 py-20 text-center md:py-28">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          AI PM 评估副驾驶
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          从模糊需求到可评审方案，强制暴露风险。
          <br />
          把想清楚、评清楚、讲清楚从 2 小时压缩到 15 分钟。
        </p>
        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/new">新建项目</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/projects">查看历史</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}