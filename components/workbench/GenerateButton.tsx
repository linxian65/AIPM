"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { StageName } from "@/lib/schemas";

type Props = { projectId: string; stage: StageName };

export function GenerateButton({ projectId, stage }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = isLoading || isPending;

  async function handleClick() {
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch(`/api/stages/${stage}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "请求失败");
        return;
      }
      // 落库后刷新 RSC
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button onClick={handleClick} disabled={busy}>
        {busy ? "生成中..." : "生成"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}