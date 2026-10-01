// Fallback 必须满足对应 StageSchemaMap[stage] 的最小约束，
// 目的是让类型不撒谎、前端任何组件渲染都不会崩。
// 但前端仍应基于 RunStageResult.ok 判断渲染路径，
// ok: false 时展示错误提示 + 重试按钮，不把 fallback 当正常产物展示。

import type { StageSchemaKey } from "@/lib/schemas";

export function buildFallback(stage: StageSchemaKey): unknown {
  switch (stage) {
    case "clarify":
      return {
        questions: [
          {
            question: "目标用户是谁？在什么场景下会触发这个 AI 功能？",
            rationale: "明确场景才能设计评估集和上线门槛。",
            priority: "high" as const,
          },
          {
            question: "成功的标准是什么？准确率、采纳率还是替代率？",
            rationale: "成功定义决定评估指标与上线门槛。",
            priority: "high" as const,
          },
          {
            question: "模型输出错误时，最坏后果是什么？",
            rationale: "评估是否需要法务或工程介入的关键。",
            priority: "high" as const,
          },
          {
            question: "用户愿意等多久？同步还是异步返回？",
            rationale: "延迟约束决定模型规模和调用方式。",
            priority: "medium" as const,
          },
          {
            question: "输入或输出是否包含敏感数据？是否需本地化或脱敏？",
            rationale: "隐私合规影响模型选型与日志策略。",
            priority: "high" as const,
          },
          {
            question: "如何量化效果？离线评估还是在线 A/B？",
            rationale: "没有量化指标就无法判断是否可以上线。",
            priority: "medium" as const,
          },
          {
            question: "怎样的指标阈值才允许灰度或全量？",
            rationale: "launch gate 是上线决策的硬条件。",
            priority: "medium" as const,
          },
          {
            question: "模型失败或置信度低时如何降级？",
            rationale: "兜底策略影响线上事故半径。",
            priority: "medium" as const,
          },
        ],
      };
    case "feature":
      return {
        name: "待定义 AI 功能",
        oneLiner: "暂未生成，请补充一句话价值描述。",
        inputs: ["用户原始输入"],
        outputs: ["结构化响应或兜底提示"],
        successCriteria: ["用户目标达成率提升"],
        nonGoals: ["暂未明确非目标范围"],
      };
    case "solution":
      return {
        options: [
          {
            name: "单模型直出",
            pros: ["实现最快", "延迟最低", "成本最低"],
            cons: ["结构难保证", "难做严格校验", "难定位错误"],
            fit: "适合低风险、对结构化要求弱的场景。",
            complexity: "low" as const,
          },
          {
            name: "模型加结构化校验",
            pros: ["输出可校验", "易接入评估", "易迭代 prompt"],
            cons: ["实现更复杂", "延迟略增", "成本略高"],
            fit: "适合需要稳定结构、且错误成本较高的场景。",
            complexity: "medium" as const,
          },
        ],
        recommendation: "默认推荐结构化校验方案，除非延迟和成本极度敏感。",
      };
    case "eval":
      return {
        offlineCases: [
          {
            category: "positive" as const,
            input: "标准正常输入示例",
            expected: "理想输出示例",
          },
          {
            category: "negative" as const,
            input: "应明确拒绝的输入",
            expected: "拒答或转人工",
          },
          {
            category: "edge" as const,
            input: "边界或长尾输入",
            expected: "降级或保留兜底话术",
          },
          {
            category: "adversarial" as const,
            input: "提示注入或诱导越权输入",
            expected: "拒绝并记录",
          },
        ],
        onlineMetrics: [
          {
            metric: "人工采纳率",
            definition: "用户未修改直接采用输出的比率",
            target: "≥70%",
          },
          {
            metric: "首响延迟",
            definition: "从请求到首字返回的时间",
            target: "≤2s P95",
          },
          {
            metric: "兜底触发率",
            definition: "模型置信度低或失败触发兜底的比率",
            target: "≤10%",
          },
        ],
        badCases: [
          {
            type: "幻觉",
            example: "模型编造不存在的政策或用户信息",
            handling: "接入事实校验或限制引用源",
          },
          {
            type: "越权",
            example: "提示注入导致模型执行未授权动作",
            handling: "工具白名单加输入清洗",
          },
        ],
        launchGates: [
          {
            metric: "离线评估通过率",
            threshold: "≥95%",
            rationale: "保证绝大多数典型场景输出合规",
          },
          {
            metric: "人工转接率",
            threshold: "≤10%",
            rationale: "兜底频率上限，避免用户体验坍塌",
          },
        ],
      };
    case "redteam":
      return {
        parties: [
          {
            role: "algo" as const,
            concerns: [
              {
                concern: "幻觉与置信度校准不足",
                severity: "high" as const,
                evidence: "模型在长尾样本上可能编造事实",
                fix: "引入事实校验与置信度阈值",
              },
            ],
          },
          {
            role: "eng" as const,
            concerns: [
              {
                concern: "延迟与成本不可控",
                severity: "medium" as const,
                evidence: "高峰流量下 P95 延迟可能劣化",
                fix: "缓存热点加模型分级路由",
              },
            ],
          },
          {
            role: "design" as const,
            concerns: [
              {
                concern: "用户预期管理与不确定性表达",
                severity: "medium" as const,
                evidence: "模型自然语言输出可能让用户误以为确定答案",
                fix: "UI 显式标注置信度与来源",
              },
            ],
          },
        ],
        topRisks: ["幻觉导致错误决策", "兜底失败引发用户投诉"],
        nextSteps: ["完善离线评估集", "设计在线指标看板"],
      };
  }
}