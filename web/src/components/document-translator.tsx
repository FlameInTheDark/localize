import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  FileText,
  Languages,
  Loader2,
  Upload,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LanguageCombobox } from "@/components/language-combobox";
import { useToast } from "@/hooks/use-toast";

// Per swagger: PDF, EPUB, MOBI, DOCX, XLSX, PPTX.
const ACCEPTED_TYPES =
  ".pdf,.epub,.mobi,.docx,.xlsx,.pptx,application/pdf,application/epub+zip,application/x-mobipocket-ebook,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.presentationml.presentation";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB safety cap.

type DocStatus = "idle" | "loading" | "success" | "error";

interface DocResult {
  text: string[];
  original: string[];
  detected: number;
  extracted: number;
  translated: number;
}

interface DocumentTranslatorProps {
  className?: string;
}

/**
 * Document translation panel.
 *
 * Accepts a document (PDF, EPUB, MOBI, DOCX, XLSX, PPTX), base64-encodes it,
 * and POSTs to /api/v1/translate/document with the target language. Displays
 * the translated text alongside per-page statistics from the backend.
 */
export function DocumentTranslator({ className }: DocumentTranslatorProps) {
  const { toast } = useToast();

  const [targetLang, setTargetLang] = React.useState("en");
  const [file, setFile] = React.useState<File | null>(null);
  const [status, setStatus] = React.useState<DocStatus>("idle");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<DocResult | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);

  const abortRef = React.useRef<AbortController | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => () => abortRef.current?.abort(), []);

  const canTranslate =
    file !== null &&
    targetLang.trim().length > 0 &&
    status !== "loading";

  const validateFile = (f: File): string | null => {
    if (f.size > MAX_FILE_SIZE) {
      return `File is too large (${formatBytes(f.size)}). Maximum is ${formatBytes(MAX_FILE_SIZE)}.`;
    }
    return null;
  };

  const handleFileSelect = (f: File | null) => {
    if (!f) return;
    const err = validateFile(f);
    if (err) {
      toast({ title: "Unsupported file", description: err, variant: "destructive" });
      return;
    }
    setFile(f);
    setResult(null);
    setStatus("idle");
    setErrorMsg(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files?.[0] ?? null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files?.[0] ?? null);
  };

  const handleClearFile = () => {
    setFile(null);
    setResult(null);
    setStatus("idle");
    setErrorMsg(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleTranslate = async () => {
    if (!file || !targetLang.trim()) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    setErrorMsg(null);

    try {
      // Read the file and base64-encode it for the OCRRequest payload.
      const buffer = await file.arrayBuffer();
      const base64 = arrayBufferToBase64(buffer);

      const res = await fetch(apiUrl("/api/v1/translate/document"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64_file: base64, language: targetLang }),
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(
          (data?.error as string) ?? `Document translation failed (${res.status}).`,
        );
        return;
      }

      const text = Array.isArray(data?.text) ? data.text : [];
      setResult({
        text: text.filter((t: unknown): t is string => typeof t === "string"),
        original: Array.isArray(data?.original)
          ? data.original.filter((t: unknown): t is string => typeof t === "string")
          : [],
        detected: typeof data?.detected === "number" ? data.detected : 0,
        extracted: typeof data?.extracted === "number" ? data.extracted : 0,
        translated: typeof data?.translated === "number" ? data.translated : 0,
      });
      setStatus("success");
    } catch (err) {
      if (controller.signal.aborted) return;
      setStatus("error");
      setErrorMsg(
        err instanceof Error ? err.message : "Unable to reach the service.",
      );
    }
  };

  const handleCopy = async () => {
    if (!result || result.text.length === 0) return;
    const text = result.text.join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({
        title: "Copy failed",
        description: "Your browser blocked clipboard access.",
        variant: "destructive",
      });
    }
  };

  const outputText = result?.text.join("\n\n") ?? "";

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-4 md:flex-1 md:overflow-hidden",
        className,
      )}
    >
      {/* Upload + controls */}
      <section className="rounded-xl border bg-card shadow-sm">
        <header className="flex h-11 shrink-0 items-center justify-between gap-2 border-b px-2">
          <LanguageCombobox
            value={targetLang}
            onChange={setTargetLang}
            label="Target language"
            placeholder="Target language"
          />
          <div className="flex shrink-0 items-center gap-1.5 pr-1">
            {status === "loading" ? (
              <Button size="sm" disabled className="gap-1.5">
                <Loader2 className="size-3.5 animate-spin" />
                <span className="hidden sm:inline">Translating</span>
              </Button>
            ) : status === "error" ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={handleTranslate}
                className="gap-1.5"
              >
                <Languages className="size-3.5" />
                Retry
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleTranslate}
                disabled={!canTranslate}
                className="gap-1.5"
              >
                <Languages className="size-3.5" />
                Translate
              </Button>
            )}
          </div>
        </header>

        <div className="p-4">
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleInputChange}
            className="sr-only"
            aria-label="Upload document"
          />

          {!file ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center transition-colors",
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
                  Drop a document here, or{" "}
                  <span className="text-primary underline-offset-4 hover:underline">
                    browse
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, EPUB, MOBI, DOCX, XLSX, PPTX · up to {formatBytes(MAX_FILE_SIZE)}
                </p>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background">
                <FileText className="size-5 text-foreground" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.size)}
                </p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClearFile}
                    className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="Remove file"
                  >
                    <X className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Remove file</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </section>

      {/* Result — two-column original | translated */}
      <section className="flex min-h-0 flex-1 flex-col rounded-xl border bg-card shadow-sm md:overflow-hidden">
        <header className="flex h-11 shrink-0 items-center justify-between gap-2 border-b px-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">Original</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="text-sm font-medium text-foreground">Translation</span>
          </div>
          <div className="flex items-center gap-1.5">
            {result && status === "success" && (
              <span className="hidden items-center gap-3 text-xs text-muted-foreground sm:flex">
                <Stat label="Detected" value={result.detected} />
                <Stat label="Extracted" value={result.extracted} />
                <Stat label="Translated" value={result.translated} />
              </span>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!outputText}
                  className="gap-1.5"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="size-3.5" />
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
          <DocResultBody
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

interface DocResultBodyProps {
  status: DocStatus;
  result: DocResult | null;
  errorMsg: string | null;
  hasFile: boolean;
  onRetry: () => void;
}

function DocResultBody({ status, result, errorMsg, hasFile, onRetry }: DocResultBodyProps) {
  if (status === "idle" && !result) {
    return (
      <div className="flex size-full items-center justify-center px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          {hasFile
            ? "Click Translate to translate your document."
            : "Upload a document to see its translation here."}
        </p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex size-full flex-col items-center justify-center gap-3 px-6 py-10 text-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Translating document…</p>
          <p className="text-xs text-muted-foreground">
            Parsing and translating pages. This may take a moment.
          </p>
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
          <p className="text-xs text-muted-foreground">
            {errorMsg ?? "Something went wrong."}
          </p>
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
            Try again
          </Button>
        </div>
      </div>
    );
  }

  if (result && result.text.length === 0) {
    return (
      <div className="flex size-full items-center justify-center px-6 py-10 text-center">
        <div className="max-w-sm space-y-1">
          <p className="text-sm font-medium text-foreground">No text found</p>
          <p className="text-xs text-muted-foreground">
            The document was processed but no translatable text was extracted.
          </p>
        </div>
      </div>
    );
  }

  // Two-column layout: original (left) | translated (right), per page.
  const pageCount = Math.max(result!.text.length, result!.original.length);
  return (
    <div className="size-full overflow-auto">
      {/* Sticky column headers for the side-by-side view */}
      <div className="sticky top-0 z-10 grid grid-cols-2 border-b bg-card/95 backdrop-blur">
        <div className="border-r px-4 py-2">
          <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
            Original
          </span>
        </div>
        <div className="px-4 py-2">
          <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
            Translation
          </span>
        </div>
      </div>

      <div className="divide-y">
        {Array.from({ length: pageCount }).map((_, i) => (
          <div key={i} className="grid grid-cols-2">
            <div className="min-w-0 border-r px-4 py-3.5">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  Page {i + 1}
                </span>
              </div>
              <p className="text-[0.95rem] leading-relaxed whitespace-pre-wrap break-words text-muted-foreground">
                {result!.original[i] ?? (
                  <span className="italic opacity-60">—</span>
                )}
              </p>
            </div>
            <div className="min-w-0 px-4 py-3.5">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="font-mono text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  Page {i + 1}
                </span>
              </div>
              <p className="text-[0.95rem] leading-relaxed whitespace-pre-wrap break-words text-foreground">
                {result!.text[i] ?? (
                  <span className="italic text-muted-foreground/60">—</span>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex items-center gap-1">
      <span className="text-muted-foreground/70">{label}</span>
      <span className="font-mono font-medium text-foreground">{value}</span>
    </span>
  );
}

/** Format bytes into a human-readable string. */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** Convert an ArrayBuffer to a base64 string (chunked to avoid call-stack limits). */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000; // 32 KB
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}
