import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { DocumentFilters } from "@/components/library/document-filters";
import { DocumentTable } from "@/components/library/document-table";
import { listAllDocuments } from "@/lib/documents/store";
import {
  documentStats,
  isDocumentSort,
  isDocumentStatus,
  queryDocuments,
} from "@/lib/documents/query";
import { isContentType } from "@/lib/ai/options";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "My Documents",
  description: "Search, filter and organise everything you have written.",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function single(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const typeParam = single(params.type);
  const statusParam = single(params.status);
  const sortParam = single(params.sort);

  const all = await listAllDocuments();
  const stats = documentStats(all);

  const documents = queryDocuments(all, {
    search: single(params.q),
    contentType: typeParam && isContentType(typeParam) ? typeParam : "all",
    status: statusParam && isDocumentStatus(statusParam) ? statusParam : "all",
    favoritesOnly: single(params.favorites) === "true",
    sort: isDocumentSort(sortParam) ? sortParam : "updated_desc",
  });

  const summary = [
    { label: "Documents", value: formatNumber(stats.total) },
    { label: "Words written", value: formatNumber(stats.words) },
    { label: "Favourites", value: formatNumber(stats.favorites) },
    { label: "In trash", value: formatNumber(stats.trashed) },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Documents"
        description="Search, filter and organise everything you have written."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map((item) => (
          <div
            key={item.label}
            className="rounded-card border border-line bg-surface px-4 py-3 shadow-card"
          >
            <p className="text-2xs font-medium uppercase tracking-wider text-faint">
              {item.label}
            </p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-ink">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <Card className="overflow-hidden">
        <Suspense fallback={<div className="h-[57px] border-b border-line" />}>
          <DocumentFilters resultCount={documents.length} />
        </Suspense>
        <DocumentTable
          documents={documents}
          emptyTitle={all.length === 0 ? "No documents yet" : "No documents match these filters"}
          emptyDescription={
            all.length === 0
              ? "Anything you write in the studio and save will appear here."
              : "Try a different search term, or clear the filters to see everything."
          }
          showEmptyAction={all.length === 0}
        />
      </Card>
    </div>
  );
}
