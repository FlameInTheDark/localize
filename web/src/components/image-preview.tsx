import * as React from "react";
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ImagePreviewProps {
  /** Data URL of the image to display. */
  src: string;
  alt?: string;
  className?: string;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;

/**
 * Image preview with zoom (mouse wheel or buttons) and pan (drag) when zoomed.
 *
 * The image is constrained to the container with `object-fit: contain` at zoom
 * level 1, so it never resizes the panel. When zoomed in, it scrolls/pan.
 */
export function ImagePreview({ src, alt = "Preview", className }: ImagePreviewProps) {
  const [zoom, setZoom] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const dragRef = React.useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Reset zoom/pan when the image changes.
  React.useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [src]);

  const clampZoom = (z: number) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));

  const handleWheel = (e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return; // only zoom with Ctrl/Cmd+wheel
    e.preventDefault();
    const delta = -e.deltaY * 0.002;
    setZoom((z) => clampZoom(z * (1 + delta)));
  };

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

  const handlePointerDown = (e: React.PointerEvent) => {
    if (zoom <= 1) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    setOffset({ x: dragRef.current.ox + dx, y: dragRef.current.oy + dy });
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
    <div
      ref={containerRef}
      onWheel={handleWheel}
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-muted/30",
        zoom > 1 && "cursor-grab active:cursor-grabbing",
        className,
      )}
    >
      <img
        src={src}
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

      {/* Zoom controls */}
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
  );
}
