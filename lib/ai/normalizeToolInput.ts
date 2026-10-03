type Unmatched = { path: string; keys: string[] };

type NormalizeResult = {
  input: unknown;
  normalized: number;
  unmatched: Unmatched[];
};

/**
 * 在校验前规范化 tool_use.input。
 * 启发式：对象元素若恰好只有一个 string 字段，则展开为该字段值。
 * 不引入 key 白名单（不假设模型用 "text" / "value" / "content"）。
 * 不做 JSON.stringify 兜底：未命中的元素保持原值并上报 unmatched。
 */
function extractSingleString(item: object): string | null {
  const keys = Object.keys(item);
  if (keys.length !== 1) return null;
  const v = (item as Record<string, unknown>)[keys[0]];
  return typeof v === "string" ? v : null;
}

export function normalizeToolInput(
  stage: string,
  input: unknown
): NormalizeResult {
  if (typeof input !== "object" || input === null) {
    return { input, normalized: 0, unmatched: [] };
  }

  let normalized = 0;
  const unmatched: Unmatched[] = [];
  const obj = { ...(input as Record<string, unknown>) };

  if (stage === "redteam") {
    for (const key of ["topRisks", "nextSteps"] as const) {
      const arr = obj[key];
      if (!Array.isArray(arr)) continue;

      obj[key] = arr.map((item, idx) => {
        if (typeof item === "string") return item;
        if (typeof item === "object" && item !== null) {
          const extracted = extractSingleString(item);
          if (extracted !== null) {
            normalized += 1;
            return extracted;
          }
          unmatched.push({
            path: `${key}[${idx}]`,
            keys: Object.keys(item),
          });
          return item;
        }
        unmatched.push({ path: `${key}[${idx}]`, keys: [] });
        return item;
      });
    }
  }

  return { input: obj, normalized, unmatched };
}
