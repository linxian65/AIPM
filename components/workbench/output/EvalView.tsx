import type { Eval } from "@/lib/schemas";

export function EvalView({ data }: { data: Eval }) {
  return (
    <div className="space-y-6">
      <header>
        <h3 className="text-sm font-semibold">评估方案</h3>
      </header>

      <Section title="离线评估集">
        <table className="w-full text-xs">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <th className="py-1 pr-2">类型</th>
              <th className="py-1 pr-2">输入</th>
              <th className="py-1">期望输出</th>
            </tr>
          </thead>
          <tbody>
            {data.offlineCases.map((c, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-2 pr-2 align-top">
                  <span className="rounded bg-muted px-1.5 py-0.5">{c.category}</span>
                </td>
                <td className="py-2 pr-2 align-top">{c.input}</td>
                <td className="py-2 align-top">{c.expected}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="在线指标">
        <table className="w-full text-xs">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <th className="py-1 pr-2">指标</th>
              <th className="py-1 pr-2">定义</th>
              <th className="py-1">目标</th>
            </tr>
          </thead>
          <tbody>
            {data.onlineMetrics.map((m, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-2 pr-2 align-top font-medium">{m.metric}</td>
                <td className="py-2 pr-2 align-top">{m.definition}</td>
                <td className="py-2 align-top">
                  <span className="rounded bg-muted px-1.5 py-0.5">{m.target}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Bad case 分类">
        <table className="w-full text-xs">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <th className="py-1 pr-2">类型</th>
              <th className="py-1 pr-2">例子</th>
              <th className="py-1">处理</th>
            </tr>
          </thead>
          <tbody>
            {data.badCases.map((b, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-2 pr-2 align-top">
                  <span className="rounded bg-muted px-1.5 py-0.5">{b.type}</span>
                </td>
                <td className="py-2 pr-2 align-top">{b.example}</td>
                <td className="py-2 align-top">{b.handling}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="上线门槛">
        <table className="w-full text-xs">
          <thead className="border-b text-left text-muted-foreground">
            <tr>
              <th className="py-1 pr-2">指标</th>
              <th className="py-1 pr-2">阈值</th>
              <th className="py-1">理由</th>
            </tr>
          </thead>
          <tbody>
            {data.launchGates.map((g, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="py-2 pr-2 align-top font-medium">{g.metric}</td>
                <td className="py-2 pr-2 align-top">
                  <span className="rounded bg-muted px-1.5 py-0.5">{g.threshold}</span>
                </td>
                <td className="py-2 align-top">{g.rationale}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}
