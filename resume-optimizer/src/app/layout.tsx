import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resume Optimizer — AI 简历优化工具",
  description: "上传简历，AI 即时分析问题并生成优化建议，让求职者们快速提升简历竞争力。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}