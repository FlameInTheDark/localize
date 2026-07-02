import * as React from "react";
import { Upload, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  IMAGE_ACCEPT,
  MAX_IMAGE_SIZE,
  formatBytes,
  validateImageFile,
} from "@/lib/image";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadAreaProps {
  onFile: (file: File) => void;
  /** When a file is already selected, show its name/size + remove button. */
  selectedFile: File | null;
  onClear: () => void;
  className?: string;
}

/**
 * Drag-and-drop / click-to-browse image upload area.
 *
 * Used by both the Image and OCR panels. Handles validation and toasts errors.
 */
export function ImageUploadArea({
  onFile,
  selectedFile,
  onClear,
  className,
}: ImageUploadAreaProps) {
  const { toast } = useToast();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);

  const handleSelect = (f: File | null) => {
    if (!f) return;
    const err = validateImageFile(f);
    if (err) {
      toast({ title: "Unsupported image", description: err, variant: "destructive" });
      return;
    }
    onFile(f);
  };

  return (
    <div className={cn("w-full", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        onChange={(e) => handleSelect(e.target.files?.[0] ?? null)}
        className="sr-only"
        aria-label="Upload image"
      />

      {!selectedFile ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleSelect(e.dataTransfer.files?.[0] ?? null);
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center transition-colors",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-foreground/30 hover:bg-accent/50",
          )}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Upload className="size-5 text-muted-foreground" />
          </span>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Drop an image here, or{" "}
              <span className="text-primary underline-offset-4 hover:underline">
                browse
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPEG, WebP, GIF, BMP · up to {formatBytes(MAX_IMAGE_SIZE)}
            </p>
          </div>
        </button>
      ) : (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-background text-xs font-mono font-semibold uppercase text-muted-foreground">
            {selectedFile.name.split(".").pop()?.slice(0, 4) ?? "?"}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {selectedFile.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatBytes(selectedFile.size)}
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  onClear();
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                aria-label="Remove image"
              >
                <X className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove image</TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  );
}
