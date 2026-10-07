"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Solution } from "@/lib/schemas";

type Props = {
  projectId: string;
  options: Solution["options"];
};

export function SolutionFeedbackForm({ projectId, options }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [choice, setChoice] = useState<string>("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const busy = isLoading || isPending;
  const canSubmit = choice.length > 0 && reason.trim().length >= 5;

  async function handleSubmit() {
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/stages/solution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          userFeedback: { choice, reason: reason.trim() },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "生成失败");
        return;
      }
      setReason("");
      setChoice("");
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "网络错误");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-muted/30 p-3">
        <p className="text-xs font-medium">选择一个方案，AI 会基于你的选择重写对比</p>
      </div>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setChoice(opt.name)}
            className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
              choice === opt.name
                ? "border-primary bg-accent"
                : "hover:bg-accent/50"
            }`}
            disabled={busy}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{opt.name}</span>
              <span className="text-xs text-muted-foreground">{opt.complexity}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{opt.fit}</p>
          </button>
        ))}
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium">
          选择理由 / 附加约束
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="为什么选它？有什么必须满足的约束？（至少 5 字）"
          rows={3}
          maxLength={2000}
          className="w-full rounded-md border px-3 py-2 text-sm"
          disabled={busy}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button onClick={handleSubmit} disabled={busy || !canSubmit}>
        {busy ? "生成中..." : "提交选择并重新生成"}
      </Button>
    </div>
  );
}
