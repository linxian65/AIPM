import { z } from "zod";

export const createProjectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "标题不能为空")
    .max(100, "标题不超过 100 字"),
  brief: z
    .string()
    .trim()
    .min(10, "需求描述至少 10 字")
    .max(500, "需求描述不超过 500 字"),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;