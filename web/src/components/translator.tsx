"use client";

import * as React from "react";
import {
  ArrowRight,
  Check,
  Copy,
  Languages,
  Loader2,
  Search,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/api";
import { resolveLanguage } from "@/lib/languages";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LanguageCombobox } from "@/components/language-combobox";
import { useToast } from "@/hooks/use-toast";

const MAX_CHARS = 5000;

type TranslateStatus = "idle" | "loading" | "success" | "error";

interface TranslatorProps {
  className?: string;
}

/**
 * Two-panel translator (DeepL / Google Translate inspired) with a Linear /
 * Vercel aesthetic.
 *
 * - Left panel: free-form input + "Detect language" action.
 * - Right panel: target language picker + read-only translation output.
 * - Translation is manual: triggered only by the "Translate" button. The
 *   textarea keeps its native behavior, so Enter inserts a newline. Stale
 *   responses are discarded via a monotonic request id + AbortController.
 *
 * The two panels share a mirrored layout — each has a header and a footer with
 * a meta on the left and an action on the right — so the sides stay symmetric.
 * The whole component stretches to fill the available vertical space.
 */
export function Translator({ className }: TranslatorProps) {
  const { toast } = useToast();
  const requestTextTab = useAppStore((s) => s.requestTextTab);
  const consumePendingInput = useAppStore((s) => s.consumePendingInput);

  const [input, setInput] = React.useState("");
  const [targetLang, setTargetLang] = React.useState("en");
  const [output, setOutput] = React.useState("");
  const [status, setStatus] = React.useState<TranslateStatus>("idle");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [detected, setDetected] = React.useState<string[] | null>(null);
  const [detecting, setDetecting] = React.useState(false);

  const [copied, setCopied] = React.useState(false);

  // When another panel (e.g. OCR) sends text to translation, load it.
  React.useEffect(() => {
    if (requestTextTab === 0) return;
    const pending = consumePendingInput();
    if (pending) {
      setInput(pending);
      setOutput("");
      setStatus("idle");
      setErrorMsg(null);
      setDetected(null);
    }
  }, [requestTextTab, consumePendingInput]);

  // Monotonic id used to discard stale translate responses.
  const requestIdRef = React.useRef(0);
  const abortRef = React.useRef<AbortController | null>(null);

  const detectedLanguages = React.useMemo(
    () => (detected ?? []).map(resolveLanguage).filter((l): l is NonNullable<typeof l> => l !== null),
    [detected],
  );
  const hasDetected = detectedLanguages.length > 0;

  const charCount = input.length;
  const overLimit = charCount > MAX_CHARS;
  const outputCount = output.length;

  const canTranslate =
    input.trim().length > 0 &&
    targetLang.trim().length > 0 &&
    !overLimit &&
    status !== "loading";

  const runTranslate = React.useCallback(
    async (text: string, language: string, id: number) => {
      // Cancel any in-flight request before starting a new one.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStatus("loading");
      setErrorMsg(null);

      try {
        const res = await fetch(apiUrl("/api/v1/translate"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, language }),
          signal: controller.signal,
        });

        // Only apply the result if this is still the latest request.
        if (id !== requestIdRef.current) return;

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          setStatus("error");
          setErrorMsg(
            (data?.error as string) ?? `Translation failed (${res.status}).`,
          );
          return;
        }

        setOutput((data?.text as string) ?? "");
        setStatus("success");
      } catch (err) {
        if (controller.signal.aborted) return;
        if (id !== requestIdRef.current) return;
        setStatus("error");
        setErrorMsg(
          err instanceof Error ? err.message : "Unable to reach the service.",
        );
      }
    },
    [],
  );

  // Manual translate: invoked only by the Translate / Retry button.
  const handleTranslate = React.useCallback(() => {
    const text = input.trim();
    if (!text || !targetLang.trim() || overLimit) return;
    const id = (requestIdRef.current += 1);
    void runTranslate(input, targetLang, id);
  }, [input, targetLang, overLimit, runTranslate]);

  // Cleanup any pending request on unmount.
  React.useEffect(() => () => abortRef.current?.abort(), []);

  const handleDetect = async () => {
    const text = input.trim();
    if (!text) {
      toast({
        title: "Nothing to detect",
        description: "Enter some text first, then detect its language.",
      });
      return;
    }

    setDetecting(true);
    try {
      const res = await fetch(apiUrl("/api/v1/translate/detect"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: "Detection failed",
          description:
            (data?.error as string) ?? `The service returned ${res.status}.`,
          variant: "destructive",
        });
        setDetected(null);
        return;
      }
      // Parse detected languages robustly. The backend (per swagger) returns
      // { "language": ["ru"] } or { "language": ["ru","en"] }, but we also
      // tolerate alternative keys, a single string, and any case.
      const langs = parseDetectedLanguages(data);
      setDetected(langs);
      if (langs.length === 0) {
        toast({
          title: "Could not detect language",
          description: "Try adding more text for a reliable detection.",
        });
      }
    } catch (err) {
      toast({
        title: "Detection failed",
        description:
          err instanceof Error ? err.message : "Unable to reach the service.",
        variant: "destructive",
      });
      setDetected(null);
    } finally {
      setDetecting(false);
    }
  };

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
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

  const handleClearInput = () => {
    setInput("");
    setOutput("");
    setStatus("idle");
    setErrorMsg(null);
    setDetected(null);
  };

  const handleUseAsInput = () => {
    if (!output) return;
    setInput(output);
    setDetected(null);
    setStatus("idle");
    setOutput("");
    setErrorMsg(null);
  };

  return (
    <div
      className={cn(
        "grid w-full grid-cols-1 gap-4 md:grid-cols-2",
        "md:min-h-0 md:flex-1 md:gap-0 md:rounded-xl md:border md:bg-card md:shadow-sm",
        "md:overflow-hidden",
        className,
      )}
    >
      {/* ----------------------------- Input panel ----------------------------- */}
      <section
        className={cn(
          "flex min-h-[16rem] flex-col rounded-xl border bg-card shadow-sm md:min-h-0 md:rounded-none md:border-0 md:shadow-none",
          "md:border-r",
        )}
      >
        {/* Header: detect control (left) · char counter (right) */}
        <header className="flex h-11 shrink-0 items-center justify-between gap-2 border-b px-2">
          <div className="min-w-0 flex-1">
            {hasDetected ? (
              <div className="flex items-center gap-1.5 pl-1">
                <span className="shrink-0 text-sm text-muted-foreground">
                  Detected:
                </span>
                <div className="flex flex-wrap items-center gap-1">
                  {detectedLanguages.map((lang, i) => (
                    <span
                      key={lang.code}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs",
                        i === 0
                          ? "bg-primary/10 font-medium text-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {lang.name}
                      <span className="font-mono text-[0.6rem] uppercase tracking-wide opacity-70">
                        {lang.code}
                      </span>
                    </span>
                  ))}
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={() => setDetected(null)}
                      aria-label="Clear detected language"
                    >
                      <X className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Clear detection</TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDetect}
                    disabled={detecting || !input.trim()}
                    className="gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    {detecting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Search className="size-4" />
                    )}
                    {detecting ? "Detecting…" : "Detect language"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Identify the language of the source text
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <span
            className={cn(
              "shrink-0 font-mono text-xs tabular-nums",
              overLimit ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {charCount.toLocaleString()}
            <span className="opacity-60"> / {MAX_CHARS.toLocaleString()}</span>
          </span>
        </header>

        {/* Body */}
        <div className="relative min-h-0 flex-1">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text to translate…"
            spellCheck={false}
            aria-label="Text to translate"
            className={cn(
              "size-full resize-none bg-transparent px-4 py-3.5 text-[0.95rem] leading-relaxed outline-none",
              "placeholder:text-muted-foreground/70",
            )}
          />
        </div>

        {/* Footer: char count (left) · clear (right) */}
        <footer className="flex h-11 shrink-0 items-center justify-between gap-2 border-t px-3">
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {charCount.toLocaleString()}
            <span className="opacity-60"> / {MAX_CHARS.toLocaleString()}</span>
          </span>
          <div className="flex items-center gap-1">
            {input.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearInput}
                    className="gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="size-3.5" />
                    Clear
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear input and output</TooltipContent>
              </Tooltip>
            )}
          </div>
        </footer>
      </section>

      {/* ----------------------------- Output panel ---------------------------- */}
      <section className="flex min-h-[16rem] flex-col rounded-xl border bg-card shadow-sm md:min-h-0 md:rounded-none md:border-0 md:shadow-none">
        {/* Header: target language (left) · translate button (right) */}
        <header className="flex h-11 shrink-0 items-center justify-between gap-2 border-b px-1">
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
                <span className="sm:hidden">…</span>
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

        {/* Body */}
        <div className="relative min-h-0 flex-1">
          <OutputBody
            status={status}
            output={output}
            errorMsg={errorMsg}
            hasInput={input.trim().length > 0}
            onRetry={handleTranslate}
            onUseAsInput={handleUseAsInput}
          />
        </div>

        {/* Footer: output count (left) · copy (right) */}
        <footer className="flex h-11 shrink-0 items-center justify-between gap-2 border-t px-3">
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {outputCount.toLocaleString()} chars
          </span>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopy}
                  disabled={!output}
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
        </footer>
      </section>
    </div>
  );
}

interface OutputBodyProps {
  status: TranslateStatus;
  output: string;
  errorMsg: string | null;
  hasInput: boolean;
  onRetry: () => void;
  onUseAsInput: () => void;
}

function OutputBody({
  status,
  output,
  errorMsg,
  hasInput,
  onRetry,
  onUseAsInput,
}: OutputBodyProps) {
  // Idle with nothing to show.
  if (status === "idle" && !output) {
    return (
      <div className="flex size-full items-center justify-center px-6 py-10 text-center">
        <div className="max-w-xs space-y-1.5">
          <p className="text-sm text-muted-foreground">
            {hasInput
              ? "Click Translate to translate."
              : "Your translation will appear here."}
          </p>
        </div>
      </div>
    );
  }

  // First-time loading (no previous output yet).
  if (status === "loading" && !output) {
    return (
      <div className="space-y-2.5 px-4 py-3.5">
        <Skeleton className="h-4 w-[92%]" />
        <Skeleton className="h-4 w-[78%]" />
        <Skeleton className="h-4 w-[85%]" />
        <Skeleton className="h-4 w-[60%]" />
      </div>
    );
  }

  // Error and no cached output.
  if (status === "error" && !output) {
    return (
      <div className="flex size-full items-center justify-center px-6 py-10 text-center">
        <div className="max-w-xs space-y-2">
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

  // Normal output (with optional loading shimmer overlay for re-translations).
  return (
    <div className="relative size-full">
      {status === "loading" && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden">
          <div className="h-full w-full animate-pulse bg-gradient-to-r from-transparent via-foreground/40 to-transparent" />
        </div>
      )}
      {/* Floating "use as input" action — keeps the footer symmetric (one
          button per side) while still surfacing the swap affordance. */}
      {output && status !== "loading" && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onUseAsInput}
              aria-label="Use translation as input"
              className="absolute right-2 top-2 z-10 size-7 text-muted-foreground opacity-60 transition-opacity hover:bg-accent hover:text-foreground hover:opacity-100 focus-visible:opacity-100"
            >
              <ArrowRight className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Use translation as input</TooltipContent>
        </Tooltip>
      )}
      <div
        className={cn(
          "size-full overflow-auto px-4 py-3.5 text-[0.95rem] leading-relaxed whitespace-pre-wrap break-words",
          status === "loading" && "opacity-60",
        )}
      >
        {output || (
          <span className="text-muted-foreground/70">
            Translation will appear here.
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Parse the language-detection response into a clean list of lowercase codes.
 *
 * The backend (per swagger) returns `{ "language": ["ru"] }` or
 * `{ "language": ["ru","en"] }`. We also tolerate, defensively:
 *   - alternative keys (`languages`, `lang`)
 *   - a single string instead of an array (`{ "language": "ru" }`)
 *   - any case (`"RU"`, `"Ru"`, `"rU"` → `"ru"`)
 *   - non-string entries (filtered out)
 *   - duplicates (preserving order of first appearance)
 *
 * Always returns lowercase codes; empty array means nothing was detected.
 */
function parseDetectedLanguages(data: unknown): string[] {
  if (typeof data !== "object" || data === null) return [];
  const obj = data as Record<string, unknown>;

  // Try the canonical key first, then common alternatives.
  const raw = obj.language ?? obj.languages ?? obj.lang;
  if (raw == null) return [];

  // Normalize to an array of strings.
  const arr = Array.isArray(raw) ? raw : [raw];

  const seen = new Set<string>();
  const result: string[] = [];
  for (const entry of arr) {
    if (typeof entry !== "string") continue;
    const code = entry.trim().toLowerCase();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    result.push(code);
  }
  return result;
}
