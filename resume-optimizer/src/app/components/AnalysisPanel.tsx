"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, Copy, Check, AlertTriangle, TrendingUp, Target, BookOpen, MessageSquare } from "lucide-react";
import type { AnalysisResult, AnalysisStatus } from "../types";

interface AnalysisPanelProps {
  status: AnalysisStatus;
  result: AnalysisResult | null;
  error: string | null;
  onAnalyze: () => void;
  canAnalyze: boolean;
}

const dimensionLabels = {
  structure: { label: "结构完整", icon: BookOpen, desc: "包含必要模块，层次清晰" },
  keywords: { label: "关键词密度", icon: Target, desc: "行业术语、岗位关键词" },
  quantification: { label: "成就量化", icon: TrendingUp, desc: "数据支撑，成果可见" },
  clarity: { label: "表达清晰", icon: MessageSquare, desc: "简洁有力，易读性强" },
};

export default function AnalysisPanel({
  status,
  result,
  error,
  onAnalyze,
  canAnalyze,
}: AnalysisPanelProps) {
  const [copied, setCopied] = useState(false);
  const [expandedIssues, setExpandedIssues] = useState(true);

  const handleCopy = async () => {
    if (result?.optimized) {
      await navigator.clipboard.writeText(result.optimized);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-error";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-success/10";
    if (score >= 60) return "bg-warning/10";
    return "bg-error/10";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-text-primary">AI 分析结果</h2>
        <p className="text-sm text-text-secondary mt-1">
          基于简历内容多维度评估
        </p>
      </div>

      {/* Analyze Button */}
      {status !== "success" && status !== "loading" && (
        <button
          onClick={onAnalyze}
          disabled={!canAnalyze}
          className={`
            w-full py-3 px-4 rounded-xl font-medium text-sm
            flex items-center justify-center gap-2
            transition-all duration-200
            ${
              canAnalyze
                ? "bg-primary hover:bg-primary-hover text-white active:scale-[0.97] cursor-pointer"
                : "bg-surface text-text-secondary cursor-not-allowed"
            }
          `}
        >
          <Sparkles className="w-4 h-4" />
          {canAnalyze ? "开始 AI 分析" : "请先上传简历"}
        </button>
      )}

      {/* Loading State */}
      {status === "loading" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 animate-fade-in">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-border"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <div className="text-center">
            <p className="text-text-primary font-medium">AI 正在分析中...</p>
            <p className="text-text-secondary text-sm mt-1">
              这可能需要几秒钟
            </p>
          </div>
          <div className="w-full space-y-3 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg skeleton" />
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {status === "error" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center animate-fade-in">
          <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-error" />
          </div>
          <div>
            <p className="text-text-primary font-medium">分析失败</p>
            <p className="text-text-secondary text-sm mt-1">{error || "请稍后重试"}</p>
          </div>
          <button
            onClick={onAnalyze}
            className="mt-2 px-4 py-2 rounded-lg bg-surface hover:bg-border text-text-primary text-sm transition-colors"
          >
            重新分析
          </button>
        </div>
      )}

      {/* Success State */}
      {status === "success" && result && (
        <div className="flex-1 overflow-auto animate-fade-in space-y-4">
          {/* Overall Score */}
          <div className={`rounded-xl p-5 ${getScoreBg(result.score)}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-secondary text-sm">综合评分</p>
                <p className={`text-4xl font-bold mt-1 ${getScoreColor(result.score)}`}>
                  {result.score}
                  <span className="text-lg text-text-secondary font-normal">/100</span>
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${getScoreColor(result.score)}`}>
                  {result.score >= 80 ? "优秀" : result.score >= 60 ? "良好" : "需改进"}
                </p>
                <p className="text-text-secondary text-xs mt-1">
                  {result.score >= 80
                    ? "简历质量很高，继续保持"
                    : result.score >= 60
                    ? "有一定基础，可进一步优化"
                    : "存在较多问题，建议重点改进"}
                </p>
              </div>
            </div>
          </div>

          {/* Dimension Scores */}
          <div className="grid grid-cols-2 gap-3">
            {(Object.entries(dimensionLabels) as [keyof typeof dimensionLabels, typeof dimensionLabels[keyof typeof dimensionLabels]][]).map(
              ([key, { label, icon: Icon, desc }]) => {
                const score = result.dimensions[key];
                return (
                  <div
                    key={key}
                    className="rounded-xl border border-border bg-surface p-3"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-primary" />
                      <span className="text-text-primary text-sm font-medium">
                        {label}
                      </span>
                    </div>
                    <p className={`text-xl font-bold ${getScoreColor(score)}`}>
                      {score}
                    </p>
                    <p className="text-text-secondary text-xs mt-1">{desc}</p>
                  </div>
                );
              }
            )}
          </div>

          {/* Issues */}
          {result.issues.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <button
                onClick={() => setExpandedIssues(!expandedIssues)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="text-text-primary font-medium text-sm">
                    发现 {result.issues.length} 个问题
                  </span>
                </div>
                {expandedIssues ? (
                  <ChevronUp className="w-4 h-4 text-text-secondary" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-text-secondary" />
                )}
              </button>
              {expandedIssues && (
                <ul className="mt-3 space-y-2">
                  {result.issues.map((issue, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-text-secondary text-sm"
                    >
                      <span className="text-warning mt-0.5">•</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-text-primary font-medium text-sm">
                  优化建议
                </span>
              </div>
              <ul className="space-y-2">
                {result.suggestions.map((suggestion, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-text-secondary text-sm"
                  >
                    <span className="text-primary mt-0.5">{i + 1}.</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Optimized Resume */}
          {result.optimized && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-success" />
                  <span className="text-text-primary font-medium text-sm">
                    优化后的简历
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background hover:bg-border text-text-secondary text-xs transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-success" />
                      <span className="text-success">已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      复制
                    </>
                  )}
                </button>
              </div>
              <div className="bg-background rounded-lg p-3 max-h-[300px] overflow-auto">
                <pre className="text-text-secondary text-xs whitespace-pre-wrap font-mono leading-relaxed">
                  {result.optimized}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Idle State */}
      {status === "idle" && !result && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mb-4">
            <Sparkles className="w-7 h-7 text-text-secondary" />
          </div>
          <p className="text-text-secondary text-sm">
            上传简历后点击"开始 AI 分析"
            <br />
            即可获得专业优化建议
          </p>
        </div>
      )}
    </div>
  );
}