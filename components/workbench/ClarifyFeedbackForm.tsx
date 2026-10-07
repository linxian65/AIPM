"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Clarify } from "@/lib/schemas";

type Props = {
  projectId: string;
  questions: Clarify["questions"];
};

export function ClarifyFeedbackForm({ projectId, questions }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  const busy = isLoading || isPending;
  const answeredCount = Object.values(answers).filter((a) => a.trim().length > 0).length;

  async function handleSubmit() {
    setError(null);
    setIsLoading(true);
    const payload = {
      projectId,
      userFeedback: {
        answers: Object.entries(answers)
          .filter(([, a]) => a.trim().length > 0)
          .map(([idx, answer]) => ({
            questionIndex: Number(idx),
            question: questions[Number(idx)].question,
            answer: answer.trim(),
          })),
      },
    };
    if (payload.userFeedback.answers.length === 0) {
      setError("至少回答一个问题");
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/stages/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "生成失败");
        return;
      }
      setAnswers({});
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
        <p className="text-xs font-medium">回答下面的问题，AI 会基于你的回答生成下一轮追问</p>
        <p className="mt-1 text-xs text-muted-foreground">
          已回答 {answeredCount} / {questions.length}
        </p>
      </div>
      <ol className="space-y-4">
        {questions.map((q, i) => (
          <li key={i} className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-xs text-muted-foreground mt-0.5 shrink-0">{i + 1}.</span>
              <p className="text-sm font-medium">{q.question}</p>
            </div>
            <textarea
              value={answers[i] ?? ""}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [i]: e.target.value }))
              }
              placeholder="你的回答..."
              rows={2}
              maxLength={2000}
              className="w-full rounded-md border px-3 py-2 text-sm"
              disabled={busy}
            />
          </li>
        ))}
      </ol>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button onClick={handleSubmit} disabled={busy || answeredCount === 0}>
        {busy ? "生成中..." : `提交 ${answeredCount} 条回答并重新生成`}
      </Button>
    </div>
  );
}
