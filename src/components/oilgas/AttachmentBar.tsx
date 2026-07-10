"use client";

import * as React from "react";
import { Paperclip, X, FileText, Image as ImageIcon, FileSpreadsheet, File, AlertCircle } from "lucide-react";
import type { FileAttachment } from "@/lib/oilgas/types";
import { cn } from "@/lib/utils";

export const MAX_FILES = 50;
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export function categorizeFile(name: string, type: string): FileAttachment["category"] {
  if (type.startsWith("image/")) return "image";
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["pdf", "doc", "docx", "txt", "md", "ppt", "pptx", "wps"].includes(ext)) return "document";
  if (["xls", "xlsx", "csv", "las", "lis", "dlis", "sgy", "segy", "shp", "dat", "json", "xml"].includes(ext)) return "data";
  return "other";
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function fileIcon(cat: FileAttachment["category"]) {
  switch (cat) {
    case "image": return <ImageIcon className="w-3 h-3" />;
    case "document": return <FileText className="w-3 h-3" />;
    case "data": return <FileSpreadsheet className="w-3 h-3" />;
    default: return <File className="w-3 h-3" />;
  }
}

interface Props {
  attachments: FileAttachment[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  compact?: boolean;
  align?: "left" | "right";
}

export function AttachmentBar({ attachments, onAdd, onRemove, compact = false, align = "left" }: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const files = Array.from(fileList);
    setError(null);

    // validate count
    const remaining = MAX_FILES - attachments.length;
    if (remaining <= 0) {
      setError(`最多上传 ${MAX_FILES} 个文件`);
      return;
    }
    if (files.length > remaining) {
      setError(`最多上传 ${MAX_FILES} 个文件，本次仅添加前 ${remaining} 个`);
    }
    const toAdd = files.slice(0, remaining);

    // validate size
    const oversized = toAdd.filter((f) => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      setError(`单个文件不能超过 100MB：${oversized.map((f) => f.name).join("、")}`);
    }
    const valid = toAdd.filter((f) => f.size <= MAX_FILE_SIZE);

    if (valid.length > 0) onAdd(valid);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className={cn("flex flex-col gap-1", align === "right" && "items-end")}>
      {attachments.length > 0 && (
        <div className={cn("flex flex-wrap gap-1.5", align === "right" && "justify-end")}>
          {attachments.map((f) => (
            <div
              key={f.id}
              className="group inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/70 border border-border text-[10px] max-w-[180px]"
            >
              <span className="text-primary shrink-0">{fileIcon(f.category)}</span>
              <span className="truncate text-foreground">{f.name}</span>
              <span className="text-muted-foreground shrink-0 hidden sm:inline">{formatSize(f.size)}</span>
              <button
                onClick={() => onRemove(f.id)}
                className="shrink-0 rounded-full hover:bg-background p-0.5 text-muted-foreground hover:text-red-600"
                aria-label="移除附件"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      {error && (
        <div className="inline-flex items-center gap-1 text-[10px] text-red-600 px-1">
          <AlertCircle className="w-2.5 h-2.5" />{error}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        accept="image/*,.pdf,.doc,.docx,.txt,.md,.ppt,.pptx,.xls,.xlsx,.csv,.las,.lis,.dlis,.sgy,.segy,.shp,.dat,.json,.xml"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "inline-flex items-center gap-1 h-6 px-2 rounded-md text-[10px] font-medium transition-colors",
          "text-muted-foreground hover:text-primary hover:bg-muted/60 border border-transparent hover:border-primary/30"
        )}
        title={`上传附件（最多 ${MAX_FILES} 个，单个 ≤ 100MB）`}
      >
        <Paperclip className="w-3 h-3" />
        {!compact && <span>附件</span>}
        {attachments.length > 0 && (
          <span className="text-primary font-bold">{attachments.length}</span>
        )}
      </button>
    </div>
  );
}

// helper to convert File -> FileAttachment
export function toAttachment(f: File): FileAttachment {
  return {
    id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: f.name,
    size: f.size,
    type: f.type,
    category: categorizeFile(f.name, f.type),
  };
}
