export interface AnalysisResult {
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

export interface UploadedFile {
  name: string;
  size: number;
  content: string;
  type: string;
}

export type AnalysisStatus = 'idle' | 'loading' | 'success' | 'error';