import { Badge } from "@/components/ui/badge";

type Props = { isCurrent: boolean; isCompleted: boolean };

export function StageBadge({ isCurrent, isCompleted }: Props) {
  if (isCurrent) {
    return <Badge variant="default">当前</Badge>;
  }
  if (isCompleted) {
    return <Badge variant="secondary">已完成</Badge>;
  }
  return <Badge variant="outline">未开始</Badge>;
}