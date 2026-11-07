"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Star, Trash2 } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import type { DocumentRecord } from "@/lib/types";

/**
 * Per-document actions. Each one calls the documents API and then refreshes the
 * server component, so what is shown always matches what is stored.
 */
export function DocumentActions({
  document,
  onError,
}: {
  document: DocumentRecord;
  onError?: (message: string) => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [favorite, setFavorite] = useState(document.isFavorite);
  const [busy, setBusy] = useState(false);

  async function call(path: string, init: RequestInit) {
    setBusy(true);
    try {
      const response = await fetch(path, init);
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        onError?.(body?.error ?? "That action could not be completed.");
        return null;
      }
      return await response.json();
    } catch {
      onError?.("Could not reach the server.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function toggleFavorite() {
    const next = !favorite;
    setFavorite(next);
    const result = await call(`/api/documents/${document.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFavorite: next }),
    });
    if (!result) {
      setFavorite(!next);
      return;
    }
    startTransition(() => router.refresh());
  }

  async function duplicate() {
    const result = await call("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `${document.title} (copy)`,
        content: document.content,
        contentType: document.contentType,
      }),
    });
    if (result) startTransition(() => router.refresh());
  }

  async function trash() {
    const result = await call(`/api/documents/${document.id}`, { method: "DELETE" });
    if (result) startTransition(() => router.refresh());
  }

  const disabled = busy || pending;

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Tooltip label={favorite ? "Remove from favourites" : "Add to favourites"}>
        <button
          type="button"
          onClick={toggleFavorite}
          disabled={disabled}
          aria-pressed={favorite}
          aria-label={
            favorite
              ? `Remove ${document.title} from favourites`
              : `Add ${document.title} to favourites`
          }
          className="rounded-control p-1.5 text-faint transition-colors hover:bg-subtle hover:text-ink disabled:opacity-50"
        >
          <Star
            className={cn("size-3.5", favorite && "fill-caution text-caution")}
            aria-hidden="true"
          />
        </button>
      </Tooltip>
      <Tooltip label="Duplicate">
        <button
          type="button"
          onClick={duplicate}
          disabled={disabled}
          aria-label={`Duplicate ${document.title}`}
          className="rounded-control p-1.5 text-faint transition-colors hover:bg-subtle hover:text-ink disabled:opacity-50"
        >
          <Copy className="size-3.5" aria-hidden="true" />
        </button>
      </Tooltip>
      <Tooltip label="Move to trash">
        <button
          type="button"
          onClick={trash}
          disabled={disabled}
          aria-label={`Move ${document.title} to trash`}
          className="rounded-control p-1.5 text-faint transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
        >
          <Trash2 className="size-3.5" aria-hidden="true" />
        </button>
      </Tooltip>
    </div>
  );
}
