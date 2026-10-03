import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownPreview({ markdown }: { markdown: string }) {
  return (
    <article className="prose prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </article>
  );
}