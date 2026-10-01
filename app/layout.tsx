import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI PM 评估副驾驶",
  description: "从模糊需求到可评审方案，强制暴露风险。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}