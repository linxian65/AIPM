// Quick test: call buildMarkdown with only clarify populated; other stages undefined.
import { buildMarkdown } from "../lib/export/buildMarkdown";
import { ClarifySchema } from "../lib/schemas";

const input = {
  questions: Array.from({ length: 8 }, (_, i) => ({
    priority: "high" as const,
    question: `测试问题 ${i + 1}`,
    rationale: `测试依据 ${i + 1}`,
  })),
};
const parsed = ClarifySchema.safeParse(input);
console.log("clarify safeParse:", JSON.stringify({ success: parsed.success, error: parsed.success ? undefined : parsed.error.flatten() }));

const md = buildMarkdown(
  { title: "只跑过 clarify 的 project", brief: "测试缺失 stage 的降级渲染" },
  { clarify: input }
);

console.log("--- 全部 6 个 ## 标题 ---");
const headers = md.split("\n").filter((l) => l.startsWith("## "));
for (const h of headers) console.log(h);

console.log("\n--- '（尚未生成）' 出现次数 ---");
console.log((md.match(/（尚未生成）/g) ?? []).length);

console.log("\n--- 前 30 行 ---");
console.log(md.split("\n").slice(0, 30).join("\n"));
