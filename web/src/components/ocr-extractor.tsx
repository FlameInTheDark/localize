import * as React from "react";
import {
  AlertCircle,
  Check,
  Copy,
  Loader2,
  ScanText,
  Send,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";
import {
  fileToBase64,
  fileToDataUrl,
  validateImageFile,
} from "@/lib/image";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ImageDropPreview } from "@/components/image-drop-preview";
import { useToast } from "@/hooks/use-toast";

type Status = "idle" | "loading" | "success" | "error";

interface OcrExtractorProps {
  className?: string;
}

/**
 * OCR extraction panel.
 *
 * Layout: image drop/preview on top (fixed height, zoomable), with the
 * extracted text in a panel below. The header has an "Extract Text" button
 * (instead of Translate) and, once text is extracted, a "Send to translation"
 * button that loads the text into the Text translator and switches to that tab.
 *
 * POSTs the image (base64) to /api/v1/translate/ocr.
 */
export function OcrExtractor({ className }: OcrExtractorProps) {
  const { toast } = useToast();
  const sendToTranslation = useAppStore((s) => s.sendToTranslation);

  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<Status>("idle");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [text, setText] = React.useState<string>("");
  const [copied, setCopied] = React.useState(false);

  const abortRef = React.useRef<AbortController | null>(null);
  React.useEffect(() => () => abortRef.current?.abort(), []);

  const canExtract = file !== null && status !== "loading";

  const handleFile = async (f: File) => {
    const err = validateImageFile(f);
    if (err) {
      toast({ title: "Unsupported image", description: err, variant: "destructive" });
      return;
    }
    setFile(f);
    setText("");
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
    setText("");
    setStatus("idle");
    setErrorMsg(null);
  };

  const handleExtract = async () => {
    if (!file) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    setErrorMsg(null);

    try {
      const base64 = await fileToBase64(file);
      const res = await fetch(apiUrl("/api/v1/translate/ocr"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64_file: base64 }),
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setErrorMsg((data?.error as string) ?? `OCR failed (${res.status}).`);
        return;
      }
      setText(typeof data?.text === "string" ? data.text : "");
      setStatus("success");
      if (!data?.text) {
        toast({ title: "No text found", description: "The image didn't contain recognizable text." });
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Unable to reach the service.");
    }
  };

  const handleCopy = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: "Copy failed", description: "Your browser blocked clipboard access.", variant: "destructive" });
    }
  };

  const handleSendToTranslation = () => {
    if (!text) return;
    sendToTranslation(text);
    toast({ title: "Sent to translation", description: "Switched to the Text tab with the extracted text." });
  };

  return (
    <div className={cn("flex w-full flex-col gap-3 md:flex-1 md:overflow-hidden", className)}>
      {/* Image drop / preview (top) */}
      <section className="flex h-56 shrink-0 flex-col rounded-xl border bg-card shadow-sm sm:h-64">
        {/* Header: just the action button on the right. */}
        <header className="flex h-11 shrink-0 items-center justify-end gap-2 border-b px-2">
          <div className="flex shrink-0 items-center gap-1.5 pr-1">
            {status === "loading" ? (
              <Button size="sm" disabled className="gap-1.5">
                <Loader2 className="size-3.5 animate-spin" />
                <span className="hidden sm:inline">Extracting</span>
              </Button>
            ) : status === "error" ? (
              <Button size="sm" variant="destructive" onClick={handleExtract} className="gap-1.5">
                <ScanText className="size-3.5" />
                Retry
              </Button>
            ) : (
              <Button size="sm" onClick={handleExtract} disabled={!canExtract} className="gap-1.5">
                <ScanText className="size-3.5" />
                Extract Text
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
            alt="Image for OCR"
            className="h-full"
          />
        </div>
      </section>

      {/* Extracted text */}
      <section className="flex min-h-0 flex-1 flex-col rounded-xl border bg-card shadow-sm md:overflow-hidden">
        <header className="flex h-11 shrink-0 items-center justify-between gap-2 border-b px-3">
          <span className="text-sm font-medium text-foreground">Extracted Text</span>
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!text}
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
              <TooltipContent>Copy extracted text</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSendToTranslation}
                  disabled={!text}
                  className="gap-1.5"
                >
                  <Send className="size-3.5" />
                  <span className="hidden sm:inline">Send to translation</span>
                  <span className="sm:hidden">Send</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send extracted text to the Text translator</TooltipContent>
            </Tooltip>
          </div>
        </header>

        <div className="relative min-h-0 flex-1 overflow-auto">
          <OcrResultBody
            status={status}
            text={text}
            errorMsg={errorMsg}
            hasFile={file !== null}
            onRetry={handleExtract}
          />
        </div>
      </section>
    </div>
  );
}

interface OcrResultBodyProps {
  status: Status;
  text: string;
  errorMsg: string | null;
  hasFile: boolean;
  onRetry: () => void;
}

function OcrResultBody({ status, text, errorMsg, hasFile, onRetry }: OcrResultBodyProps) {
  if (status === "idle" && !text) {
    return (
      <div className="flex size-full items-center justify-center px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          {hasFile ? "Click Extract Text to read text from the image." : "Upload an image to extract text here."}
        </p>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-4 w-[92%]" />
        <Skeleton className="h-4 w-[78%]" />
        <Skeleton className="h-4 w-[85%]" />
        <Skeleton className="h-4 w-[60%]" />
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
          <p className="text-sm font-medium text-destructive">Extraction failed</p>
          <p className="text-xs text-muted-foreground">{errorMsg ?? "Something went wrong."}</p>
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="size-full overflow-auto px-4 py-3.5">
      <p className="text-[0.95rem] leading-relaxed whitespace-pre-wrap break-words text-foreground">
        {text || <span className="italic text-muted-foreground/60">No text was found in the image.</span>}
      </p>
    </div>
  );
}
