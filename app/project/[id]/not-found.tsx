import Link from "next/link";

export default function NotFound() {
  return (
    <main className="container max-w-2xl py-24 text-center">
      <h1 className="text-2xl font-semibold">项目不存在</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        该项目可能已被删除，或链接无效。
      </p>
      <Link href="/" className="mt-6 inline-block text-sm underline">
        返回首页
      </Link>
    </main>
  );
}