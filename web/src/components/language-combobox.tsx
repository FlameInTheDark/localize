"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Globe, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  LANGUAGES,
  POPULAR_LANGUAGES,
  resolveLanguage,
  type Language,
} from "@/lib/languages";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface LanguageComboboxProps {
  /** Currently selected ISO 639-1 code (or any string the backend accepts). */
  value: string;
  /** Called when the user picks a language. */
  onChange: (code: string) => void;
  /** Optional aria-label for the trigger button. */
  label?: string;
  /** Render the trigger at a smaller size (used inside dense toolbars). */
  compact?: boolean;
  /** Optional placeholder shown when no value is selected. */
  placeholder?: string;
  className?: string;
}

/**
 * Searchable language picker built on the shadcn Popover + Command primitives.
 *
 * - Languages can be searched by English name, native name, or ISO code.
 * - A "Popular" group surfaces the most common languages for fast access.
 * - If the query doesn't match any known language, the user can still send the
 *   raw string to the backend (which accepts arbitrary language codes).
 */
export function LanguageCombobox({
  value,
  onChange,
  label = "Select target language",
  compact = false,
  placeholder = "Select language",
  className,
}: LanguageComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selected = resolveLanguage(value);

  // Normalize the query for tolerant matching against name/native/code.
  const normalizedQuery = query.trim().toLowerCase();
  const hasQuery = normalizedQuery.length > 0;

  const matches = React.useMemo(() => {
    if (!hasQuery) return LANGUAGES;
    return LANGUAGES.filter((lang) => {
      const haystack = [
        lang.name,
        lang.native ?? "",
        lang.code,
        lang.name.toLowerCase(),
        (lang.native ?? "").toLowerCase(),
      ];
      return haystack.some((field) => field.toLowerCase().includes(normalizedQuery));
    });
  }, [hasQuery, normalizedQuery]);

  // Determine whether the current query itself is a valid-looking custom code.
  // We show a "use as code" option when there are no exact matches and the
  // query is non-empty (so power users can pass any value to the backend).
  const exactCodeMatch = hasQuery
    ? LANGUAGE_CODE_SET.has(normalizedQuery)
    : false;
  const showCustomOption = hasQuery && !exactCodeMatch;

  const handleSelect = React.useCallback(
    (code: string) => {
      onChange(code);
      setOpen(false);
      setQuery("");
    },
    [onChange],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          aria-label={label}
          className={cn(
            "group h-auto justify-between gap-2 px-2 font-medium hover:bg-transparent",
            compact ? "py-1 text-sm" : "py-1.5 text-sm",
            "text-foreground",
            className,
          )}
        >
          <span className="flex items-center gap-2 truncate">
            <Globe className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">
              {selected ? selected.name : placeholder}
            </span>
            {selected && (
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                {selected.code}
              </span>
            )}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-[20rem] p-0"
        // Keep focus inside the popover for keyboard users.
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false} loop>
          <CommandInput
            placeholder="Search language or ISO code…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>
              {hasQuery
                ? "No matching language."
                : "Start typing to search languages."}
            </CommandEmpty>

            {!hasQuery && (
              <>
                <CommandGroup heading="Popular">
                  {POPULAR_LANGUAGES.map((lang) => (
                    <LanguageItem
                      key={`popular-${lang.code}`}
                      lang={lang}
                      selectedCode={value}
                      onSelect={handleSelect}
                    />
                  ))}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            <CommandGroup
              heading={hasQuery ? "Results" : "All languages"}
            >
              {matches.slice(0, 200).map((lang) => (
                <LanguageItem
                  key={lang.code}
                  lang={lang}
                  selectedCode={value}
                  onSelect={handleSelect}
                />
              ))}
              {matches.length > 200 && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  Showing first 200 — refine your search to see more.
                </div>
              )}
            </CommandGroup>

            {showCustomOption && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Custom">
                  <CommandItem
                    value={`__custom__${normalizedQuery}`}
                    onSelect={() => handleSelect(normalizedQuery)}
                    className="gap-2"
                  >
                    <Plus className="size-4 text-muted-foreground" />
                    <span className="flex-1">
                      Use{" "}
                      <span className="font-mono font-semibold">
                        {normalizedQuery}
                      </span>{" "}
                      as language code
                    </span>
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface LanguageItemProps {
  lang: Language;
  selectedCode: string;
  onSelect: (code: string) => void;
}

function LanguageItem({ lang, selectedCode, onSelect }: LanguageItemProps) {
  const isSelected = lang.code === selectedCode;
  return (
    <CommandItem
      value={`${lang.name} ${lang.code} ${lang.native ?? ""}`}
      onSelect={() => onSelect(lang.code)}
      className="gap-3"
    >
      <Check
        className={cn(
          "size-4 shrink-0",
          isSelected ? "opacity-100" : "opacity-0",
        )}
      />
      <span className="flex-1 truncate">
        <span className="text-foreground">{lang.name}</span>
        {lang.native && lang.native !== lang.name && (
          <span className="text-muted-foreground"> · {lang.native}</span>
        )}
      </span>
      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
        {lang.code}
      </span>
    </CommandItem>
  );
}

const LANGUAGE_CODE_SET = new Set(LANGUAGES.map((l) => l.code));
