"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function MarkdownSource({ markdown }: { markdown: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("[copy] failed", err);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-xs font-medium text-muted-foreground">Markdown 源码</span>
        <Button size="sm" variant="outline" onClick={handleCopy}>
          {copied ? "已复制" : "复制"}
        </Button>
      </div>
      <pre className="flex-1 overflow-auto p-4 text-xs leading-relaxed">
        <code>{markdown}</code>
      </pre>
    </div>
  );
}