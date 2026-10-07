import { z } from "zod";
import { PrioritySchema } from "./common";

export const ClarifySchema = z.object({
  questions: z
    .array(
      z.object({
        question: z.string().min(4),
        rationale: z.string().min(4),
        priority: PrioritySchema,
      })
    )
    .min(8)
    .max(12),
  // 首轮为空数组；修订轮次把用户回答提炼成结构化约束。
  // 不设 min(1) 保持 required 字段但允许空数组，strict 模式兼容。
  clarifiedConstraints: z.array(z.string().min(4)).max(20),
});

export type Clarify = z.infer<typeof ClarifySchema>;
