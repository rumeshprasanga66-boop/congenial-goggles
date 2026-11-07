import type { ContentType, DocumentRecord, DocumentStatus } from "@/lib/types";

/**
 * Document shaping and querying, kept free of storage concerns.
 *
 * Everything here is a pure function over plain records, so the library's
 * filtering, sorting and searching can be tested without a database and reused
 * unchanged when the store moves to Supabase.
 */

export interface DocumentInput {
  title?: string;
  content: string;
  contentType: ContentType;
  status?: DocumentStatus;
  isFavorite?: boolean;
}

export const MAX_TITLE_LENGTH = 200;
export const MAX_CONTENT_LENGTH = 400_000;

/**
 * Derive a title from the content when the user has not set one. Uses the first
 * non-empty line, trimmed to a readable length, rather than a placeholder.
 */
export function deriveTitle(content: string): string {
  const firstLine = content
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0);

  if (!firstLine) return "Untitled document";

  const withoutHeading = firstLine.replace(/^#{1,6}\s*/, "");
  if (withoutHeading.length <= 70) return withoutHeading;
  return `${withoutHeading.slice(0, 67).trimEnd()}…`;
}

export function normaliseTitle(title: string | undefined, content: string): string {
  const trimmed = (title ?? "").trim();
  if (!trimmed) return deriveTitle(content);
  return trimmed.length > MAX_TITLE_LENGTH
    ? trimmed.slice(0, MAX_TITLE_LENGTH).trimEnd()
    : trimmed;
}

export type DocumentSort =
  | "updated_desc"
  | "updated_asc"
  | "created_desc"
  | "title_asc"
  | "words_desc";

export const DOCUMENT_SORTS: Array<{ id: DocumentSort; label: string }> = [
  { id: "updated_desc", label: "Recently updated" },
  { id: "updated_asc", label: "Oldest updated first" },
  { id: "created_desc", label: "Recently created" },
  { id: "title_asc", label: "Title A to Z" },
  { id: "words_desc", label: "Longest first" },
];

export const DOCUMENT_STATUSES: Array<{ id: DocumentStatus; label: string }> = [
  { id: "draft", label: "Draft" },
  { id: "in_review", label: "In review" },
  { id: "final", label: "Final" },
];

export function isDocumentStatus(value: unknown): value is DocumentStatus {
  return (
    typeof value === "string" &&
    DOCUMENT_STATUSES.some((status) => status.id === value)
  );
}

export function isDocumentSort(value: unknown): value is DocumentSort {
  return (
    typeof value === "string" && DOCUMENT_SORTS.some((sort) => sort.id === value)
  );
}

export interface DocumentQuery {
  /** Free text matched against the title and body. */
  search?: string;
  contentType?: ContentType | "all";
  status?: DocumentStatus | "all";
  favoritesOnly?: boolean;
  sort?: DocumentSort;
}

/**
 * Filter and sort documents. Trashed documents are always excluded here; the
 * trash view asks for them explicitly instead.
 */
export function queryDocuments(
  documents: DocumentRecord[],
  query: DocumentQuery = {},
): DocumentRecord[] {
  const search = query.search?.trim().toLowerCase() ?? "";

  const filtered = documents.filter((document) => {
    if (document.deletedAt) return false;
    if (query.favoritesOnly && !document.isFavorite) return false;
    if (query.contentType && query.contentType !== "all" && document.contentType !== query.contentType) {
      return false;
    }
    if (query.status && query.status !== "all" && document.status !== query.status) {
      return false;
    }
    if (search) {
      const haystack = `${document.title}\n${document.content}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  return sortDocuments(filtered, query.sort ?? "updated_desc");
}

export function sortDocuments(
  documents: DocumentRecord[],
  sort: DocumentSort,
): DocumentRecord[] {
  const sorted = [...documents];
  switch (sort) {
    case "updated_desc":
      return sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    case "updated_asc":
      return sorted.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    case "created_desc":
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "title_asc":
      return sorted.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
    case "words_desc":
      return sorted.sort((a, b) => b.wordCount - a.wordCount);
  }
}

/** Documents that have been moved to trash, most recently deleted first. */
export function trashedDocuments(documents: DocumentRecord[]): DocumentRecord[] {
  return documents
    .filter((document) => document.deletedAt !== null)
    .sort((a, b) => (b.deletedAt ?? "").localeCompare(a.deletedAt ?? ""));
}

/** Favourites, most recently updated first. */
export function favouriteDocuments(documents: DocumentRecord[]): DocumentRecord[] {
  return queryDocuments(documents, { favoritesOnly: true });
}

export interface DocumentStats {
  total: number;
  words: number;
  favorites: number;
  trashed: number;
}

/** Totals for the library header. Trashed documents are counted separately. */
export function documentStats(documents: DocumentRecord[]): DocumentStats {
  const live = documents.filter((document) => !document.deletedAt);
  return {
    total: live.length,
    words: live.reduce((sum, document) => sum + document.wordCount, 0),
    favorites: live.filter((document) => document.isFavorite).length,
    trashed: documents.length - live.length,
  };
}

/**
 * How long a trashed document is kept before permanent deletion. Trash is a
 * safety net, not storage, so the window is stated in the UI.
 */
export const TRASH_RETENTION_DAYS = 30;

export function daysUntilPurge(deletedAt: string, now = Date.now()): number {
  const deleted = Date.parse(deletedAt);
  if (Number.isNaN(deleted)) return TRASH_RETENTION_DAYS;
  const elapsedDays = (now - deleted) / 86_400_000;
  return Math.max(0, Math.ceil(TRASH_RETENTION_DAYS - elapsedDays));
}
