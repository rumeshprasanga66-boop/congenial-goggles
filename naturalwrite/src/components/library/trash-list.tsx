"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/format";
import type { DocumentRecord } from "@/lib/types";

/**
 * Trash list. Restore is one click; permanent deletion asks first, because it
 * cannot be undone.
 */
export function TrashList({ documents }: { documents: DocumentRecord[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  async function call(path: string, init: RequestInit) {
    try {
      const response = await fetch(path, init);
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        setError(body?.error ?? "That action could not be completed.");
        return false;
      }
      return true;
    } catch {
      setError("Could not reach the server.");
      return false;
    }
  }

  async function restore(id: string) {
    setBusyId(id);
    setError(null);
    if (await call(`/api/documents/${id}`, { method: "POST" })) {
      startTransition(() => router.refresh());
    }
    setBusyId(null);
  }

  async function removeForever(id: string) {
    setBusyId(id);
    setError(null);
    if (await call(`/api/documents/${id}?permanent=true`, { method: "DELETE" })) {
      setConfirmingId(null);
      startTransition(() => router.refresh());
    }
    setBusyId(null);
  }

  return (
    <div>
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 border-b border-danger/20 bg-danger/5 px-4 py-2 text-xs text-danger"
        >
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}
      <ul className="divide-y divide-line">
        {documents.map((document) => (
          <li
            key={document.id}
            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{document.title}</p>
              <p className="mt-0.5 text-xs text-muted">
                Deleted {formatRelativeTime(document.deletedAt ?? document.updatedAt)} ·{" "}
                {document.wordCount.toLocaleString("en-US")} words
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {confirmingId === document.id ? (
                <>
                  <span className="text-xs text-danger">Delete permanently?</span>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => void removeForever(document.id)}
                    disabled={busyId === document.id || pending}
                  >
                    Yes, delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmingId(null)}
                    disabled={busyId === document.id}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void restore(document.id)}
                    disabled={busyId === document.id || pending}
                  >
                    <RotateCcw className="size-3.5" aria-hidden="true" />
                    Restore
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmingId(document.id)}
                    disabled={busyId === document.id || pending}
                    aria-label={`Delete ${document.title} permanently`}
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Delete forever
                  </Button>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
