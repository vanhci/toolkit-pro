import { NextRequest, NextResponse } from "next/server";
import { MiniMax } from "@/app/lib/minimax";

export async function POST(request: NextRequest) {
  try {
    const { content, filename } = await request.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "简历内容不能为空" }, { status: 400 });
    }

    if (content.length < 50) {
      return NextResponse.json({ error: "简历内容过短，无法分析" }, { status: 400 });
    }

    const minimax = new MiniMax();
    const result = await minimax.analyzeResume(content, filename || "resume.txt");

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "分析失败，请稍后重试" },
      { status: 500 }
    );
  }
}