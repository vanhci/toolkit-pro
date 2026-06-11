"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import type { UploadedFile } from "../types";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
];

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".doc", ".txt"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface UploadZoneProps {
  onFileUploaded: (file: UploadedFile) => void;
  uploadedFile: UploadedFile | null;
  onClear: () => void;
  disabled?: boolean;
}

export default function UploadZone({
  onFileUploaded,
  uploadedFile,
  onClear,
  disabled = false,
}: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return `不支持的文件格式，请上传 ${ACCEPTED_EXTENSIONS.join(", ")}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return "文件大小超过 5MB 限制";
    }
    return null;
  };

  const extractText = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "txt") {
      return await file.text();
    }

    if (ext === "pdf") {
      // Dynamically import pdf-parse
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParseModule: any = await import("pdf-parse");
      const pdfParse = pdfParseModule.default || pdfParseModule;
      const arrayBuffer = await file.arrayBuffer();
      const pdfData = new Uint8Array(arrayBuffer);
      const pdfText = await pdfParse(pdfData);
      return pdfText.text;
    }

    if (ext === "docx" || ext === "doc") {
      // Dynamically import mammoth
      const mammoth = await import("mammoth");
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }

    return "";
  };

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      try {
        const content = await extractText(file);
        if (content.trim().length < 20) {
          setError("文件内容过短或无法读取");
          return;
        }
        onFileUploaded({
          name: file.name,
          size: file.size,
          content: content.trim(),
          type: file.type,
        });
      } catch (err) {
        setError("文件读取失败，请尝试其他文件");
        console.error(err);
      }
    },
    [onFileUploaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile, disabled]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-text-primary">上传简历</h2>
        <p className="text-sm text-text-secondary mt-1">
          支持 PDF、Word、TXT 格式，最大 5MB
        </p>
      </div>

      {!uploadedFile ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`
            flex-1 min-h-[200px] rounded-xl border-2 border-dashed cursor-pointer
            transition-all duration-200 flex flex-col items-center justify-center gap-3
            ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50 hover:bg-surface"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          <div
            className={`
              w-14 h-14 rounded-full flex items-center justify-center
              ${isDragging ? "bg-primary/20" : "bg-surface"}
              transition-colors duration-200
            `}
          >
            <Upload
              className={`w-6 h-6 ${
                isDragging ? "text-primary" : "text-text-secondary"
              }`}
            />
          </div>
          <div className="text-center">
            <p className="text-text-primary font-medium">
              {isDragging ? "释放以上传" : "拖拽简历到此处"}
            </p>
            <p className="text-text-secondary text-sm mt-1">
              或{" "}
              <span className="text-primary hover:underline">点击选择文件</span>
            </p>
          </div>
          <p className="text-text-secondary text-xs mt-2">
            {ACCEPTED_EXTENSIONS.join(" / ")}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS.join(",")}
            onChange={handleInputChange}
            className="hidden"
            disabled={disabled}
          />
        </div>
      ) : (
        <div className="flex-1 rounded-xl border border-border bg-surface p-4 flex flex-col">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-text-primary font-medium truncate">
                {uploadedFile.name}
              </p>
              <p className="text-text-secondary text-sm mt-0.5">
                {formatSize(uploadedFile.size)}
              </p>
            </div>
            <button
              onClick={onClear}
              className="w-8 h-8 rounded-lg hover:bg-border flex items-center justify-center transition-colors flex-shrink-0"
              disabled={disabled}
            >
              <X className="w-4 h-4 text-text-secondary" />
            </button>
          </div>
          <div className="mt-4 flex-1 bg-background rounded-lg p-3 overflow-auto">
            <p className="text-text-secondary text-xs font-medium mb-2">预览</p>
            <pre className="text-text-secondary text-xs whitespace-pre-wrap font-mono leading-relaxed">
              {uploadedFile.content.slice(0, 500)}
              {uploadedFile.content.length > 500 && "..."}
            </pre>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 text-error text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}