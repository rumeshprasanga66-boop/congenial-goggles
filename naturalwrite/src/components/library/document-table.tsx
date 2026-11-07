"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, FileText } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { DocumentActions } from "./document-actions";
import { formatNumber, formatRelativeTime } from "@/lib/format";
import { CONTENT_TYPES } from "@/lib/ai/options";
import { DOCUMENT_STATUSES } from "@/lib/documents/query";
import type { DocumentRecord } from "@/lib/types";

const typeLabels = new Map(CONTENT_TYPES.map((type) => [type.id, type.label]));
const statusLabels = new Map(DOCUMENT_STATUSES.map((status) => [status.id, status.label]));

const statusTone = {
  draft: "neutral",
  in_review: "caution",
  final: "positive",
} as const;

/**
 * The document library table. Rendering is separated from data fetching so the
 * empty and populated states are both exercised without a database.
 */
export function DocumentTable({
  documents,
  emptyTitle = "No documents yet",
  emptyDescription = "Anything you write in the studio and save will appear here.",
  showEmptyAction = true,
}: {
  documents: DocumentRecord[];
  emptyTitle?: string;
  emptyDescription?: string;
  showEmptyAction?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="size-5" aria-hidden="true" />}
        title={emptyTitle}
        description={emptyDescription}
        action={
          showEmptyAction ? (
            <Link
              href="/dashboard/writer"
              className="inline-flex h-9 items-center rounded-control bg-brand px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-ink"
            >
              Start writing
            </Link>
          ) : undefined
        }
      />
    );
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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              {["Document", "Type", "Status", "Last modified", "Words", ""].map(
                (heading, index) => (
                  <th
                    key={heading || index}
                    scope="col"
                    className="whitespace-nowrap px-4 py-2.5 text-2xs font-semibold uppercase tracking-wide text-faint"
                  >
                    {heading}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="border-b border-line last:border-0 hover:bg-subtle">
                <td className="max-w-[280px] px-4 py-3">
                  <Link
                    href={`/dashboard/documents/${doc.id}`}
                    className="flex items-center gap-2 rounded-control focus-visible:outline-none"
                  >
                    <FileText className="size-3.5 shrink-0 text-faint" aria-hidden="true" />
                    <span className="truncate font-medium text-ink hover:text-brand-ink">
                      {doc.title}
                    </span>
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">
                  {typeLabels.get(doc.contentType) ?? doc.contentType}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <Badge tone={statusTone[doc.status]}>
                    {statusLabels.get(doc.status) ?? doc.status}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">
                  {formatRelativeTime(doc.updatedAt)}
                </td>
                <td className="px-4 py-3 tabular-nums text-muted">
                  {formatNumber(doc.wordCount)}
                </td>
                <td className="px-4 py-3">
                  <DocumentActions document={doc} onError={setError} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
