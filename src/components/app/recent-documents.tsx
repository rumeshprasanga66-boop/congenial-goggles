import Link from "next/link";
import { FileText } from "lucide-react";
import { DocumentActions } from "@/components/library/document-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { formatNumber, formatRelativeTime } from "@/lib/format";
import type { ContentType, DocumentRecord } from "@/lib/types";

const contentTypeLabels: Record<ContentType, string> = {
  article: "Article",
  blog_post: "Blog post",
  email: "Email",
  business: "Business",
  essay: "Essay",
  social: "Social",
  product: "Product",
  creative: "Creative",
  other: "Other",
};

const statusLabels: Record<DocumentRecord["status"], string> = {
  draft: "Draft",
  in_review: "In review",
  final: "Final",
};

export function RecentDocuments({
  documents,
}: {
  documents: DocumentRecord[];
}) {
  if (documents.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="size-5" aria-hidden="true" />}
        title="No documents yet"
        description="Your drafts, articles and emails will appear here as soon as you create the first one."
        action={
          <Link
            href="/dashboard/writer"
            className="inline-flex h-9 items-center rounded-control bg-brand px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-ink"
          >
            Create your first document
          </Link>
        }
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            {[
              "Document",
              "Type",
              "Last modified",
              "Words",
              "Status",
              "",
            ].map((heading, index) => (
              <th
                key={heading || index}
                scope="col"
                className="whitespace-nowrap px-4 py-2.5 text-2xs font-semibold uppercase tracking-wide text-faint"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr
              key={doc.id}
              className="border-b border-line last:border-0 hover:bg-subtle"
            >
              <td className="px-4 py-3">
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
              <td className="px-4 py-3 text-muted">
                {contentTypeLabels[doc.contentType]}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-muted">
                {formatRelativeTime(doc.updatedAt)}
              </td>
              <td className="px-4 py-3 tabular-nums text-muted">
                {formatNumber(doc.wordCount)}
              </td>
              <td className="px-4 py-3 text-muted">
                {statusLabels[doc.status]}
              </td>
              <td className="px-4 py-3">
                <DocumentActions document={doc} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
