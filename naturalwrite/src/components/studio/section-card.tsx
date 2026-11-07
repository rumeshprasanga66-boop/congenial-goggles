"use client";

import { useState } from "react";
import { AlertCircle, Check, Copy, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { countWords } from "@/lib/format";
import type { StudioSection } from "./types";

/**
 * One section of the draft.
 *
 * Prose is editable in place: generation is a starting point, not a finished
 * document. Regenerating replaces only this section.
 */
export function SectionCard({
  section,
  index,
  onTextChange,
  onGenerate,
  disabled,
}: {
  section: StudioSection;
  index: number;
  onTextChange: (text: string) => void;
  onGenerate: () => void;
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const words = section.text ? countWords(section.text) : 0;
  const isWriting = section.status === "writing";

  async function copy() {
    if (!section.text) return;
    try {
      await navigator.clipboard.writeText(section.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied; the text stays selectable either way.
    }
  }

  return (
    <article
      className={cn(
        "rounded-card border bg-surface shadow-card transition-colors",
        section.status === "error" ? "border-danger/30" : "border-line",
      )}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-3.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-faint">{index + 1}</span>
            <h3 className="truncate text-sm font-semibold tracking-tight text-ink">
              {section.title}
            </h3>
          </div>
          {section.summary && (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted">{section.summary}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {section.status === "ready" && (
            <span className="text-2xs text-muted">
              {words.toLocaleString("en-US")} words
            </span>
          )}
          {section.text && (
            <Button
              variant="ghost"
              size="sm"
              onClick={copy}
              aria-label={`Copy the text of ${section.title}`}
              className="px-2"
            >
              {copied ? (
                <Check className="size-4 text-positive" aria-hidden="true" />
              ) : (
                <Copy className="size-4" aria-hidden="true" />
              )}
            </Button>
          )}
          <Button
            variant={section.text ? "ghost" : "secondary"}
            size="sm"
            onClick={onGenerate}
            disabled={disabled || isWriting}
          >
            {isWriting ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Writing…
              </>
            ) : section.text ? (
              <>
                <RefreshCw className="size-4" aria-hidden="true" />
                Regenerate
              </>
            ) : (
              <>
                <Sparkles className="size-4" aria-hidden="true" />
                Write this section
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="px-5 py-4">
        {section.status === "error" ? (
          <div className="flex items-start gap-2.5" role="alert">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-danger">
                This section could not be written
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {section.error ?? "The request failed. Try again."}
              </p>
            </div>
          </div>
        ) : isWriting && !section.text ? (
          <div className="space-y-2" aria-hidden="true">
            <div className="h-3 w-full animate-pulse rounded bg-subtle" />
            <div className="h-3 w-11/12 animate-pulse rounded bg-subtle" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-subtle" />
          </div>
        ) : section.text ? (
          <>
            <label className="sr-only" htmlFor={`${section.id}-text`}>
              {section.title} text
            </label>
            <Textarea
              id={`${section.id}-text`}
              value={section.text}
              onChange={(event) => onTextChange(event.target.value)}
              disabled={disabled}
              rows={Math.min(24, Math.max(6, Math.ceil(section.text.length / 90)))}
              className="border-transparent bg-transparent px-0 py-0 font-serif text-[15px] leading-7 hover:border-transparent focus:border-transparent"
              spellCheck
            />
          </>
        ) : (
          <p className="text-xs text-muted">
            Not written yet. About {section.wordTarget.toLocaleString("en-US")} words planned.
          </p>
        )}
      </div>
    </article>
  );
}
