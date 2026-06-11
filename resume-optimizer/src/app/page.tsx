"use client";

import { useState, useCallback } from "react";
import { FileText, Globe, Zap } from "lucide-react";
import UploadZone from "./components/UploadZone";
import AnalysisPanel from "./components/AnalysisPanel";
import type { UploadedFile, AnalysisResult, AnalysisStatus } from "./types";

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>("idle");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUploaded = useCallback((file: UploadedFile) => {
    setUploadedFile(file);
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  const handleClear = useCallback(() => {
    setUploadedFile(null);
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!uploadedFile) return;

    setStatus("loading");
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: uploadedFile.content,
          filename: uploadedFile.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "分析失败");
      }

      setResult(data);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
      setStatus("error");
    }
  }, [uploadedFile]);

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-surface/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-text-primary font-semibold text-sm">
                Resume Optimizer
              </h1>
              <p className="text-text-secondary text-xs">AI 简历优化工具</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <Globe className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
              <Zap className="w-3 h-3" />
              AI Powered
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary leading-tight">
              让 AI 帮你优化简历
              <br />
              <span className="text-primary">快速提升求职竞争力</span>
            </h2>
            <p className="text-text-secondary mt-4 text-base md:text-lg leading-relaxed">
              上传简历，AI 即时分析结构、关键词、成就量化等维度，
              <br className="hidden md:block" />
              并给出具体优化建议和改写后的简历内容。
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-8 md:py-12 w-full">
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Left Column - Upload */}
          <div className="bg-surface rounded-2xl border border-border p-5 md:p-6">
            <UploadZone
              onFileUploaded={handleFileUploaded}
              uploadedFile={uploadedFile}
              onClear={handleClear}
              disabled={status === "loading"}
            />
          </div>

          {/* Right Column - Analysis */}
          <div className="bg-surface rounded-2xl border border-border p-5 md:p-6">
            <AnalysisPanel
              status={status}
              result={result}
              error={error}
              onAnalyze={handleAnalyze}
              canAnalyze={!!uploadedFile && status !== "loading"}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-text-secondary text-xs">
            <p>© 2026 Resume Optimizer. 仅供演示，请勿作为正式法律或职业建议。</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-text-primary transition-colors">
                使用条款
              </a>
              <a href="#" className="hover:text-text-primary transition-colors">
                隐私政策
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}