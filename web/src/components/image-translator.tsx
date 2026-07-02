import * as React from "react";
import {
  AlertCircle,
  Check,
  Copy,
  Languages,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";
import {
  fileToBase64,
  fileToDataUrl,
  validateImageFile,
} from "@/lib/image";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LanguageCombobox } from "@/components/language-combobox";
import { ImageDropPreview } from "@/components/image-drop-preview";
import { useToast } from "@/hooks/use-toast";

type Status = "idle" | "loading" | "success" | "error";

interface ImageResult {
  original: string;
  translation: string;
}

interface ImageTranslatorProps {
  className?: string;
}

/**
 * Image translation panel.
 *
 * Layout: image drop/preview on top (fixed height, zoomable), with a
 * two-column original | translation text panel below. POSTs the image
 * (base64) to /api/v1/translate/image with the target language.
 */
export function ImageTranslator({ className }: ImageTranslatorProps) {
  const { toast } = useToast();

  const [targetLang, setTargetLang] = React.useState("en");
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<Status>("idle");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<ImageResult | null>(null);
  const [copied, setCopied] = React.useState(false);

  const abortRef = React.useRef<AbortController | null>(null);
  React.useEffect(() => () => abortRef.current?.abort(), []);

  const canTranslate = file !== null && targetLang.trim() !== "" && status !== "loading";

  const handleFile = async (f: File) => {
    const err = validateImageFile(f);
    if (err) {
      toast({ title: "Unsupported image", description: err, variant: "destructive" });
      return;
    }
    setFile(f);
    setResult(null);
    setStatus("idle");
    setErrorMsg(null);
    try {
      const url = await fileToDataUrl(f);
      setPreview(url);
    } catch {
      setPreview(null);
      toast({ title: "Preview failed", description: "Could not read the image.", variant: "destructive" });
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setStatus("idle");
    setErrorMsg(null);
  };

  const handleTranslate = async () => {
    if (!file || !targetLang.trim()) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    setErrorMsg(null);

    try {
      const base64 = await fileToBase64(file);
      const res = await fetch(apiUrl("/api/v1/translate/image"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64_file: base64, language: targetLang }),
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setErrorMsg((data?.error as string) ?? `Image translation failed (${res.status}).`);
        return;
      }
      setResult({
        original: typeof data?.original === "string" ? data.original : "",
        translation: typeof data?.translation === "string" ? data.translation : "",
      });
      setStatus("success");
    } catch (err) {
      if (controller.signal.aborted) return;
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Unable to reach the service.");
    }
  };

  const handleCopy = async () => {
    if (!result?.translation) return;
    try {
      await navigator.clipboard.writeText(result.translation);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: "Copy failed", description: "Your browser blocked clipboard access.", variant: "destructive" });
    }
  };

  return (
    <div className={cn("flex w-full flex-col gap-3 md:flex-1 md:overflow-hidden", className)}>
      {/* Image drop / preview (top) — fixed height. */}
      <section className="flex h-56 shrink-0 flex-col rounded-xl border bg-card shadow-sm sm:h-64">
        {/* Header: just the action button on the right. */}
        <header className="flex h-11 shrink-0 items-center justify-end gap-2 border-b px-2">
          <div className="flex shrink-0 items-center gap-1.5 pr-1">
            {status === "loading" ? (
              <Button size="sm" disabled className="gap-1.5">
                <Loader2 className="size-3.5 animate-spin" />
                <span className="hidden sm:inline">Translating</span>
              </Button>
            ) : status === "error" ? (
              <Button size="sm" variant="destructive" onClick={handleTranslate} className="gap-1.5">
                <Languages className="size-3.5" />
                Retry
              </Button>
            ) : (
              <Button size="sm" onClick={handleTranslate} disabled={!canTranslate} className="gap-1.5">
                <Languages className="size-3.5" />
                Translate
              </Button>
            )}
          </div>
        </header>
        {/* Body: drop zone / preview. */}
        <div className="relative min-h-0 flex-1 p-2">
          <ImageDropPreview
            file={file}
            preview={preview}
            onFile={handleFile}
            onClear={handleClear}
            alt="Image to translate"
            className="h-full"
          />
        </div>
      </section>

      {/* Language + result (two-column) */}
      <section className="flex min-h-0 flex-1 flex-col rounded-xl border bg-card shadow-sm md:overflow-hidden">
        <header className="flex h-11 shrink-0 items-center justify-between gap-2 border-b px-2">
          <LanguageCombobox
            value={targetLang}
            onChange={setTargetLang}
            label="Target language"
            placeholder="Target language"
          />
          <div className="flex items-center gap-1.5 pr-1">
            <span className="hidden text-sm font-medium text-foreground sm:inline">Original · Translation</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!result?.translation}
                  className="gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      Copy
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy translation</TooltipContent>
            </Tooltip>
          </div>
        </header>

        <div className="relative min-h-0 flex-1 overflow-auto">
          <ImageResultBody
            status={status}
            result={result}
            errorMsg={errorMsg}
            hasFile={file !== null}
            onRetry={handleTranslate}
          />
        </div>
      </section>
    </div>
  );
}

interface ImageResultBodyProps {
  status: Status;
  result: ImageResult | null;
  errorMsg: string | null;
  hasFile: boolean;
  onRetry: () => void;
}

function ImageResultBody({ status, result, errorMsg, hasFile, onRetry }: ImageResultBodyProps) {
  if (status === "idle" && !result) {
    return (
      <div className="flex size-full items-center justify-center px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          {hasFile ? "Click Translate to translate the image text." : "Upload an image to see its translation here."}
        </p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="grid h-full grid-cols-2">
        <div className="border-r p-4">
          <Skeleton className="mb-2 h-3 w-16" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="mt-2 h-4 w-[70%]" />
        </div>
        <div className="p-4">
          <Skeleton className="mb-2 h-3 w-16" />
          <Skeleton className="h-4 w-[85%]" />
          <Skeleton className="mt-2 h-4 w-[60%]" />
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex size-full items-center justify-center px-6 py-10 text-center">
        <div className="max-w-sm space-y-2">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="size-5 text-destructive" />
          </div>
          <p className="text-sm font-medium text-destructive">Translation failed</p>
          <p className="text-xs text-muted-foreground">{errorMsg ?? "Something went wrong."}</p>
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full grid-cols-2">
      <div className="min-w-0 border-r px-4 py-3.5">
        <span className="mb-2 block font-mono text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
          Original
        </span>
        <p className="text-[0.95rem] leading-relaxed whitespace-pre-wrap break-words text-muted-foreground">
          {result!.original || <span className="italic opacity-60">—</span>}
        </p>
      </div>
      <div className="min-w-0 px-4 py-3.5">
        <span className="mb-2 block font-mono text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
          Translation
        </span>
        <p className="text-[0.95rem] leading-relaxed whitespace-pre-wrap break-words text-foreground">
          {result!.translation || <span className="italic text-muted-foreground/60">—</span>}
        </p>
      </div>
    </div>
  );
}
