// MiniMax API integration
// In production, set MINIMAX_API_KEY and MINIMAX_API_URL in environment variables
// For MVP, this uses a mock implementation that simulates AI analysis

interface AnalysisResult {
  score: number;
  dimensions: {
    structure: number;
    keywords: number;
    quantification: number;
    clarity: number;
  };
  issues: string[];
  suggestions: string[];
  optimized: string;
}

export class MiniMax {
  private apiKey: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.MINIMAX_API_KEY || "mock-key";
    this.apiUrl = process.env.MINIMAX_API_URL || "https://api.minimax.chat/v1/text/chatcompletion_pro";
  }

  async analyzeResume(content: string, filename: string): Promise<AnalysisResult> {
    // Check if we have a real API key
    if (this.apiKey && this.apiKey !== "mock-key") {
      return this.callMiniMaxAPI(content);
    }

    // Mock implementation for MVP
    return this.mockAnalysis(content, filename);
  }

  private async callMiniMaxAPI(content: string): Promise<AnalysisResult> {
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: "MiniMax-Text-01",
        messages: [
          {
            role: "system",
            content: `你是一个专业的简历优化顾问。请分析用户提供的简历内容，从以下维度进行评估：
1. 结构完整性 (structure): 简历结构是否清晰，包含必要模块
2. 关键词密度 (keywords): 是否包含目标岗位的关键词
3. 成就量化 (quantification): 成就是否用数据量化
4. 表达清晰度 (clarity): 表达是否简洁有力

请以JSON格式返回分析结果，格式如下：
{
  "score": 0-100的总分,
  "dimensions": {
    "structure": 0-100分数,
    "keywords": 0-100分数,
    "quantification": 0-100分数,
    "clarity": 0-100分数
  },
  "issues": ["问题1", "问题2", ...],
  "suggestions": ["建议1", "建议2", ...],
  "optimized": "优化后的简历文本"
}

请直接返回JSON，不要有其他内容。`
          },
          {
            role: "user",
            content: `请分析以下简历内容：\n\n${content}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`MiniMax API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error("Invalid API response");
    }

    // Parse JSON from response
    const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse analysis result");
    }

    return JSON.parse(jsonMatch[0]);
  }

  private mockAnalysis(content: string, filename: string): AnalysisResult {
    // Simulate AI analysis based on content patterns
    const wordCount = content.split(/\s+/).length;
    const lines = content.split('\n');
    const hasContact = /电话|手机|邮箱|email|phone|mobile|微信|wechat/i.test(content);
    const hasEducation = /教育|学历|学校|university|college|school|degree/i.test(content);
    const hasExperience = /经验|工作|实习|经历|experience|intern|job|position/i.test(content);
    const hasProject = /项目|project/i.test(content);
    const hasSkill = /技能|skill|熟悉|掌握|熟练|擅长/i.test(content);

    // Calculate dimension scores
    let structure = 40;
    if (hasContact) structure += 15;
    if (hasEducation) structure += 15;
    if (hasExperience) structure += 15;
    if (hasProject) structure += 10;
    if (hasSkill) structure += 5;
    structure = Math.min(100, structure);

    const keywords = content.match(/增长|提升|优化|负责|主导|带领|团队|管理|开发|设计|实现|测试|部署|业绩|收入|用户|转化率|ROI|CPA|LTV/i)?.length || 0;
    const keywordsScore = Math.min(100, 30 + keywords * 8);

    const quantified = content.match(/\d+[%％]|\d+倍|\d+万|\d+人|\d+个|\d+次|\d+\+/g)?.length || 0;
    const quantification = Math.min(100, 25 + quantified * 12);

    const avgLineLength = lines.reduce((sum, l) => sum + l.length, 0) / lines.length;
    const clarity = avgLineLength < 50 ? 85 : avgLineLength < 80 ? 75 : 65;

    const totalScore = Math.round(structure * 0.25 + keywordsScore * 0.25 + quantification * 0.3 + clarity * 0.2);

    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!hasContact) issues.push("缺少联系方式（电话、邮箱、微信）");
    if (!hasEducation) issues.push("缺少教育背景信息");
    if (!hasExperience) issues.push("缺少工作/实习经历");
    if (quantified < 3) issues.push("成就描述缺少数据量化");
    if (avgLineLength > 80) issues.push("部分描述过于冗长，建议精简");

    if (!hasProject) suggestions.push("建议添加项目经历，展示实际动手能力");
    if (keywords < 3) suggestions.push("建议增加行业关键词，如'增长'、'优化'、'管理'等");
    if (!hasSkill) suggestions.push("建议增加技能特长模块");
    suggestions.push("使用STAR法则描述工作成就：Situation（背景）、Task（任务）、Action（行动）、Result（结果）");
    suggestions.push("每段经历控制在2-3行，优先展示与目标岗位相关的成就");

    const optimized = this.generateOptimizedResume(content, issues);

    return {
      score: totalScore,
      dimensions: {
        structure: structure,
        keywords: keywordsScore,
        quantification: quantification,
        clarity: clarity,
      },
      issues,
      suggestions,
      optimized,
    };
  }

  private generateOptimizedResume(original: string, issues: string[]): string {
    // Generate a simple optimized version
    const sections = original.split(/\n\n+/);
    let optimized = "# 优化后的简历\n\n";

    // Try to identify and reorganize sections
    const contactMatch = original.match(/(电话|手机|邮箱|email|phone|mobile|微信|wechat)[：:]\s*[\S]+/i);
    const educationMatch = original.match(/教育背景[\s\S]*?(?=工作经历|项目经历|技能|$)[\s\S]{0,500}/i);
    const experienceMatch = original.match(/工作经历[\s\S]*?(?=项目经历|教育背景|技能|$)[\s\S]{0,800}/i);

    if (contactMatch) {
      optimized += `## 联系方式\n${contactMatch[0]}\n\n`;
    }

    if (educationMatch) {
      optimized += `## 教育背景\n${educationMatch[0].replace(/教育背景/, '').trim()}\n\n`;
    }

    if (experienceMatch) {
      optimized += `## 工作经历\n${experienceMatch[0].replace(/工作经历/, '').trim()}\n\n`;
    }

    // Add sample quantified achievements
    optimized += `## 优化亮点\n`;
    optimized += `- 主导完成XX项目，团队规模5人，项目周期3个月\n`;
    optimized += `- 优化核心流程，效率提升40%，节省成本XX万元\n`;
    optimized += `- 负责用户增长策略，月活用户从X万增长至Y万，增幅25%\n`;

    optimized += `\n---\n💡 提示：以上为AI生成的优化参考，请根据实际情况调整具体数据和表述。`;

    return optimized;
  }
}