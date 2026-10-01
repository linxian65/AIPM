"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createProject, type CreateProjectState } from "./actions";
import { Button } from "@/components/ui/button";

const initialState: CreateProjectState = {};

export function NewProjectForm() {
  const [state, formAction] = useFormState(createProject, initialState);

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          项目标题
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={100}
          placeholder="例如：电商客服退换货 Agent"
          className="w-full rounded-md border px-3 py-2"
        />
        {state.errors?.title && (
          <p className="mt-1 text-sm text-red-600">{state.errors.title[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="brief" className="block text-sm font-medium mb-2">
          一句话需求
        </label>
        <textarea
          id="brief"
          name="brief"
          required
          rows={4}
          minLength={10}
          maxLength={500}
          placeholder="描述你想做的 AI 功能，例如：自动处理用户退换货申请，判断是否符合政策，复杂场景转人工。"
          className="w-full rounded-md border px-3 py-2"
        />
        {state.errors?.brief && (
          <p className="mt-1 text-sm text-red-600">{state.errors.brief[0]}</p>
        )}
      </div>

      {state.errors?._form && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.errors._form[0]}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "创建中..." : "创建项目"}
    </Button>
  );
}