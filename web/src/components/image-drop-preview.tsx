import * as React from "react";
import { Maximize2, Upload, X, ZoomIn, ZoomOut } from "lucide-react";

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

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;

interface ImageDropPreviewProps {
  /** Currently selected file (null = empty drop state). */
  file: File | null;
  /** Data URL preview of the image (null when no file). */
  preview: string | null;
  /** Called when the user selects/drops a valid file. */
  onFile: (file: File) => void;
  /** Called when the user removes the current file. */
  onClear: () => void;
  /** Alt text for the preview image. */
  alt?: string;
  className?: string;
}

/**
 * Combined image drop-zone + zoomable preview.
 *
 * - Empty state: a full-area drag-and-drop / click-to-browse zone.
 * - File selected: the image preview with zoom (wheel/buttons) + pan (drag),
 *   and a small "remove" button overlaid in the top-left corner.
 *
 * This keeps the parent header clean (just the action button) — the upload
 * affordance lives in the body where it has room to breathe.
 */
export function ImageDropPreview({
  file,
  preview,
  onFile,
  onClear,
  alt = "Preview",
  className,
}: ImageDropPreviewProps) {
  const { toast } = useToast();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [zoom, setZoom] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const dragRef = React.useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  // Reset zoom/pan when the image changes.
  React.useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [preview]);

  const handleSelect = (f: File | null) => {
    if (!f) return;
    const err = validateImageFile(f);
    if (err) {
      toast({ title: "Unsupported image", description: err, variant: "destructive" });
      return;
    }
    onFile(f);
  };

  const clampZoom = (z: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));
  const zoomIn = () => setZoom((z) => clampZoom(z + 0.5));
  const zoomOut = () => {
    setZoom((z) => {
      const next = clampZoom(z - 0.5);
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  };
  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    const delta = -e.deltaY * 0.002;
    setZoom((z) => clampZoom(z * (1 + delta)));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (zoom <= 1) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setOffset({
      x: dragRef.current.ox + (e.clientX - dragRef.current.x),
      y: dragRef.current.oy + (e.clientY - dragRef.current.y),
    });
  };
  const handlePointerUp = (e: React.PointerEvent) => {
    dragRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div className={cn("relative", className)}>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        onChange={(e) => handleSelect(e.target.files?.[0] ?? null)}
        className="sr-only"
        aria-label="Upload image"
      />

      {!preview ? (
        // Empty state: drop zone fills the whole area.
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
            "flex size-full flex-col items-center justify-center gap-3 rounded-lg text-center transition-colors",
            dragOver
              ? "border-2 border-dashed border-primary bg-primary/5"
              : "border-2 border-dashed border-border hover:border-foreground/30 hover:bg-accent/40",
          )}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Upload className="size-5 text-muted-foreground" />
          </span>
          <div className="space-y-1 px-6">
            <p className="text-sm font-medium text-foreground">
              Drop an image here, or{" "}
              <span className="text-primary underline-offset-4 hover:underline">browse</span>
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPEG, WebP, GIF, BMP · up to {formatBytes(MAX_IMAGE_SIZE)}
            </p>
          </div>
        </button>
      ) : (
        // Preview state: image + zoom controls + remove button.
        <div
          onWheel={handleWheel}
          className={cn(
            "relative flex size-full items-center justify-center overflow-hidden bg-muted/30",
            zoom > 1 && "cursor-grab active:cursor-grabbing",
          )}
        >
          <img
            src={preview}
            alt={alt}
            draggable={false}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="max-h-full max-w-full select-none object-contain transition-transform duration-150"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: "center center",
            }}
          />

          {/* Filename badge (top-left) */}
          <div className="pointer-events-none absolute left-2 top-2 flex max-w-[60%] items-center gap-1.5 rounded-md border border-border/60 bg-card/90 px-2 py-1 text-xs shadow-sm backdrop-blur">
            <span className="truncate font-medium text-foreground">{file?.name}</span>
            {file && <span className="shrink-0 text-muted-foreground">{formatBytes(file.size)}</span>}
          </div>

          {/* Remove button (top-right) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                onClick={onClear}
                className="absolute right-2 top-2 size-7 shadow-sm"
                aria-label="Remove image"
              >
                <X className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove image</TooltipContent>
          </Tooltip>

          {/* Zoom controls (bottom-right) */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-lg border border-border/60 bg-card/90 p-1 shadow-sm backdrop-blur">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={zoomOut}
                  disabled={zoom <= MIN_ZOOM}
                  aria-label="Zoom out"
                >
                  <ZoomOut className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom out</TooltipContent>
            </Tooltip>
            <span className="min-w-[2.5rem] text-center font-mono text-[0.7rem] tabular-nums text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={zoomIn}
                  disabled={zoom >= MAX_ZOOM}
                  aria-label="Zoom in"
                >
                  <ZoomIn className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Zoom in</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  onClick={reset}
                  disabled={zoom === 1}
                  aria-label="Reset zoom"
                >
                  <Maximize2 className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Reset</TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
}
