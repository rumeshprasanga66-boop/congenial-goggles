"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input, Select } from "@/components/ui/form";
import { CONTENT_TYPES } from "@/lib/ai/options";
import { DOCUMENT_SORTS, DOCUMENT_STATUSES } from "@/lib/documents/query";

/**
 * Library filters.
 *
 * State lives in the URL so a filtered view can be shared or reloaded and still
 * show the same documents. The search box is debounced so typing does not fire a
 * request per keystroke.
 */
export function DocumentFilters({ resultCount }: { resultCount: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [term, setTerm] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setTerm(searchParams.get("q") ?? "");
  }, [searchParams]);

  function apply(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (term === current) return;
    const timer = window.setTimeout(() => apply("q", term), 300);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  const hasFilters =
    Boolean(searchParams.get("q")) ||
    Boolean(searchParams.get("type")) ||
    Boolean(searchParams.get("status")) ||
    searchParams.get("favorites") === "true";

  return (
    <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint"
          aria-hidden="true"
        />
        <label className="sr-only" htmlFor="library-search">
          Search documents
        </label>
        <Input
          id="library-search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search titles and content"
          className="pl-8"
        />
        {term && (
          <button
            type="button"
            onClick={() => setTerm("")}
            aria-label="Clear the search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-control p-1 text-faint hover:text-ink"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="library-type">
          Filter by type
        </label>
        <Select
          id="library-type"
          value={searchParams.get("type") ?? "all"}
          onChange={(event) => apply("type", event.target.value)}
          className="h-9 w-auto min-w-[8rem]"
        >
          <option value="all">All types</option>
          {CONTENT_TYPES.map((type) => (
            <option key={type.id} value={type.id}>
              {type.label}
            </option>
          ))}
        </Select>

        <label className="sr-only" htmlFor="library-status">
          Filter by status
        </label>
        <Select
          id="library-status"
          value={searchParams.get("status") ?? "all"}
          onChange={(event) => apply("status", event.target.value)}
          className="h-9 w-auto min-w-[8rem]"
        >
          <option value="all">Any status</option>
          {DOCUMENT_STATUSES.map((status) => (
            <option key={status.id} value={status.id}>
              {status.label}
            </option>
          ))}
        </Select>

        <label className="sr-only" htmlFor="library-sort">
          Sort documents
        </label>
        <Select
          id="library-sort"
          value={searchParams.get("sort") ?? DOCUMENT_SORTS[0].id}
          onChange={(event) => apply("sort", event.target.value)}
          className="h-9 w-auto min-w-[10rem]"
        >
          {DOCUMENT_SORTS.map((sort) => (
            <option key={sort.id} value={sort.id}>
              {sort.label}
            </option>
          ))}
        </Select>

        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setTerm("");
              router.replace(pathname);
            }}
            className="rounded-control px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-subtle hover:text-ink"
          >
            Clear filters
          </button>
        )}

        <span className="whitespace-nowrap text-xs text-muted">
          {resultCount} {resultCount === 1 ? "document" : "documents"}
        </span>
      </div>
    </div>
  );
}
