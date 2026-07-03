import * as React from "react";
import { FileText, GitGraph, Image as ImageIcon, Languages, ScanText, Type } from "lucide-react";

import { Translator } from "@/components/translator";
import { DocumentTranslator } from "@/components/document-translator";
import { ImageTranslator } from "@/components/image-translator";
import { OcrExtractor } from "@/components/ocr-extractor";
import { ThemeToggle } from "@/components/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppStore } from "@/lib/store";

export function App() {
  // Controlled tab state so we can programmatically switch to "text" when the
  // OCR panel sends extracted text to translation.
  const [tab, setTab] = React.useState("text");
  const requestTextTab = useAppStore((s) => s.requestTextTab);

  React.useEffect(() => {
    if (requestTextTab > 0) setTab("text");
  }, [requestTextTab]);

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Ambient background — subtle monochrome glow + grid. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute left-1/2 top-[-12rem] h-[28rem] w-[60rem] -translate-x-1/2 rounded-full bg-foreground/[0.04] blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.18] dark:opacity-[0.22]"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse 80% 50% at 50% 0%, black 40%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 50% at 50% 0%, black 40%, transparent 100%)",
          }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="group flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg border border-border/80 bg-card shadow-sm">
              <Languages className="size-4 text-foreground" />
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className="text-[0.95rem] font-semibold tracking-tight text-foreground">
                Localize
              </span>
              <span className="hidden text-[0.7rem] font-medium text-muted-foreground sm:inline">
                · AI Translation
              </span>
            </span>
          </div>

          <nav className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <a
                  href="https://github.com/FlameInTheDark/localize"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  aria-label="Source on GitHub"
                >
                  <GitGraph className="size-[1.05rem]" />
                </a>
              </TooltipTrigger>
              <TooltipContent>Source on GitHub</TooltipContent>
            </Tooltip>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Main — fills remaining viewport height so the translator can grow. */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pt-4 pb-6 sm:px-6">
        <Tabs
          value={tab}
          onValueChange={setTab}
          className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3"
        >
          {/* Tab selector */}
          <div className="flex justify-center">
            <TabsList>
              <TabsTrigger value="text" className="gap-1.5">
                <Type className="size-4" />
                <span className="hidden sm:inline">Text</span>
              </TabsTrigger>
              <TabsTrigger value="document" className="gap-1.5">
                <FileText className="size-4" />
                <span className="hidden sm:inline">Document</span>
              </TabsTrigger>
              <TabsTrigger value="image" className="gap-1.5">
                <ImageIcon className="size-4" />
                <span className="hidden sm:inline">Image</span>
              </TabsTrigger>
              <TabsTrigger value="ocr" className="gap-1.5">
                <ScanText className="size-4" />
                <span className="hidden sm:inline">OCR</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="text" className="data-[state=inactive]:hidden">
            <Translator className="min-h-0" />
          </TabsContent>

          <TabsContent value="document" className="data-[state=inactive]:hidden">
            <DocumentTranslator className="min-h-0" />
          </TabsContent>

          <TabsContent value="image" className="data-[state=inactive]:hidden">
            <ImageTranslator className="min-h-0" />
          </TabsContent>

          <TabsContent value="ocr" className="data-[state=inactive]:hidden">
            <OcrExtractor className="min-h-0" />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
