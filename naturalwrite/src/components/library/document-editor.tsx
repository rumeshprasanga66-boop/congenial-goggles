"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CloudOff,
  Loader2,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { countWords, formatRelativeTime } from "@/lib/format";
import { CONTENT_TYPES } from "@/lib/ai/options";
import { DOCUMENT_STATUSES } from "@/lib/documents/query";
import type { ContentType, DocumentRecord, DocumentStatus } from "@/lib/types";

type SaveState = "idle" | "saving" | "saved" | "error";

const AUTOSAVE_DELAY_MS = 1200;

/**
 * Document editor with autosave.
 *
 * Edits are held locally and written back after a short pause, so typing is
 * never blocked by the network. A failed save keeps the text on screen and says
 * so, rather than silently discarding work or claiming a save that did not
 * happen.
 */
export function DocumentEditor({ document }: { document: DocumentRecord }) {
  const router = useRouter();
  const [title, setTitle] = useState(document.title);
  const [content, setContent] = useState(document.content);
  const [contentType, setContentType] = useState<ContentType>(document.contentType);
  const [status, setStatus] = useState<DocumentStatus>(document.status);
  const [favorite, setFavorite] = useState(document.isFavorite);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [savedAt, setSavedAt] = useState<string>(document.updatedAt);
  const [error, setError] = useState<string | null>(null);

  const timer = useRef<number | null>(null);
  const dirty = useRef(false);

  const save = useCallback(
    async (patch: Record<string, unknown>) => {
      setSaveState("saving");
      setError(null);
      try {
        const response = await fetch(`/api/documents/${document.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          setError(body?.error ?? "This document could not be saved.");
          setSaveState("error");
          return;
        }
        const body = await response.json();
        setSavedAt(body.document.updatedAt);
        setSaveState("saved");
        dirty.current = false;
        router.refresh();
      } catch {
        setError("Could not reach the server. Your changes are still on screen.");
        setSaveState("error");
      }
    },
    [document.id, router],
  );

  // Debounced autosave for the two free-text fields.
  useEffect(() => {
    if (!dirty.current) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      void save({ title, content });
    }, AUTOSAVE_DELAY_MS);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [title, content, save]);

  // Warn before leaving with unsaved edits still in flight.
  useEffect(() => {
    function handler(event: BeforeUnloadEvent) {
      if (dirty.current) event.preventDefault();
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const words = countWords(content);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard/documents"
          className="inline-flex items-center gap-1.5 rounded-control text-xs font-medium text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          All documents
        </Link>

        <div className="flex items-center gap-3">
          <SaveIndicator state={saveState} savedAt={savedAt} />
          <button
            type="button"
            onClick={() => {
              const next = !favorite;
              setFavorite(next);
              void save({ isFavorite: next });
            }}
            aria-pressed={favorite}
            aria-label={favorite ? "Remove from favourites" : "Add to favourites"}
            className="rounded-control p-1.5 text-faint transition-colors hover:bg-subtle hover:text-ink"
          >
            <Star
              className={cn("size-4", favorite && "fill-caution text-caution")}
              aria-hidden="true"
            />
          </button>
          <Button
            variant="danger"
            size="sm"
            onClick={async () => {
              await fetch(`/api/documents/${document.id}`, { method: "DELETE" });
              router.push("/dashboard/documents");
            }}
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Move to trash
          </Button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-control border border-danger/25 bg-danger/5 px-3 py-2.5"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
          <p className="text-xs text-danger">{error}</p>
        </div>
      )}

      <div className="rounded-card border border-line bg-surface shadow-card">
        <div className="border-b border-line px-5 py-4 sm:px-8">
          <label className="sr-only" htmlFor="doc-title">
            Document title
          </label>
          <Input
            id="doc-title"
            value={title}
            onChange={(event) => {
              dirty.current = true;
              setTitle(event.target.value);
            }}
            maxLength={200}
            className="h-auto border-transparent bg-transparent px-0 text-2xl font-semibold tracking-tight hover:border-transparent focus:border-transparent"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted" htmlFor="doc-type">
                Type
              </label>
              <Select
                id="doc-type"
                value={contentType}
                onChange={(event) => {
                  const next = event.target.value as ContentType;
                  setContentType(next);
                  void save({ contentType: next });
                }}
                className="h-8 w-auto min-w-[9rem] text-xs"
              >
                {CONTENT_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted" htmlFor="doc-status">
                Status
              </label>
              <Select
                id="doc-status"
                value={status}
                onChange={(event) => {
                  const next = event.target.value as DocumentStatus;
                  setStatus(next);
                  void save({ status: next });
                }}
                className="h-8 w-auto min-w-[8rem] text-xs"
              >
                {DOCUMENT_STATUSES.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <span className="text-xs text-muted">
              {words.toLocaleString("en-US")} words
            </span>
          </div>
        </div>

        <div className="px-5 py-6 sm:px-8">
          <label className="sr-only" htmlFor="doc-content">
            Document content
          </label>
          <Textarea
            id="doc-content"
            value={content}
            onChange={(event) => {
              dirty.current = true;
              setContent(event.target.value);
            }}
            rows={Math.min(40, Math.max(16, Math.ceil(content.length / 80)))}
            spellCheck
            className="border-transparent bg-transparent px-0 py-0 font-serif text-[15px] leading-7 hover:border-transparent focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}

function SaveIndicator({ state, savedAt }: { state: SaveState; savedAt: string }) {
  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted">
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        Saving…
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-danger">
        <CloudOff className="size-3.5" aria-hidden="true" />
        Not saved
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-positive">
        <Check className="size-3.5" aria-hidden="true" />
        Saved
      </span>
    );
  }
  return (
    <span className="text-xs text-muted">Saved {formatRelativeTime(savedAt)}</span>
  );
}
