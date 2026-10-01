import Link from "next/link";
import { NewProjectForm } from "./NewProjectForm";

export default function NewProjectPage() {
  return (
    <main className="container max-w-2xl py-16">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← 返回首页
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">新建项目</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          输入你想做的 AI 功能，EvalCopilot
          会带你走完引导追问 → 方案对比 → 评估设计 → 红队评审。
        </p>
      </div>
      <NewProjectForm />
    </main>
  );
}