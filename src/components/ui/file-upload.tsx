"use client";

import { useRef, useState } from "react";
import { Upload, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type FileUploadProps = {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  onFiles?: (files: File[]) => void;
  className?: string;
};

export function FileUpload({
  accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  multiple = false,
  maxFiles = 5,
  onFiles,
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  function handleSelect(selected: FileList | null) {
    if (!selected) return;
    const incoming = Array.from(selected).slice(0, maxFiles - files.length);
    const next = [...files, ...incoming].slice(0, maxFiles);
    setFiles(next);
    onFiles?.(next);
  }

  function removeFile(index: number) {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    onFiles?.(next);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border/70 bg-secondary/30 px-6 py-8 text-center transition hover:border-primary/40 hover:bg-secondary/50"
      >
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
          <Upload className="size-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">
            Arrastra archivos o haz clic para seleccionar
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {accept.replace(/\./g, "").toUpperCase().replace(/,/g, ", ")} (max {maxFiles} archivos)
          </p>
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => handleSelect(e.target.files)}
      />
      {files.length > 0 ? (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 rounded-xl border border-border/70 bg-secondary/40 px-3 py-2"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(0)} KB
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                onClick={() => removeFile(index)}
              >
                <X className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
