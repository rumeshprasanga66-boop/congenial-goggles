import "server-only";

import { randomUUID } from "node:crypto";

import type { ContentType, DocumentRecord, DocumentStatus } from "@/lib/types";
import { countWords } from "@/lib/format";
import { createJsonStore } from "@/lib/store/json-store";
import {
  MAX_CONTENT_LENGTH,
  normaliseTitle,
  type DocumentInput,
} from "./query";

/**
 * Document storage.
 *
 * Documents are written to a JSON file on the server so they genuinely persist
 * across restarts. That is the right shape for a self-hosted or local install,
 * and it keeps the same interface the Supabase adapter will implement, so no
 * caller changes when the store is swapped.
 *
 * There is no multi-user isolation yet: every document belongs to the same
 * workspace. Accounts arrive with the Supabase adapter, and the library says so
 * rather than implying private data.
 */

export const STORAGE_KIND = "file" as const;

const store = createJsonStore<DocumentRecord>("documents.json");

function clampContent(content: string): string {
  return content.length > MAX_CONTENT_LENGTH
    ? content.slice(0, MAX_CONTENT_LENGTH)
    : content;
}

export async function listAllDocuments(): Promise<DocumentRecord[]> {
  return store.read();
}

export async function getDocument(id: string): Promise<DocumentRecord | null> {
  const documents = await store.read();
  return documents.find((document) => document.id === id) ?? null;
}

export async function createDocument(input: DocumentInput): Promise<DocumentRecord> {
  return store.update((documents) => {
    const content = clampContent(input.content);
    const now = new Date().toISOString();

    const document: DocumentRecord = {
      id: randomUUID(),
      title: normaliseTitle(input.title, content),
      content,
      contentType: input.contentType,
      wordCount: countWords(content),
      isFavorite: input.isFavorite ?? false,
      status: input.status ?? "draft",
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    return { items: [document, ...documents], result: document };
  });
}

export interface DocumentPatch {
  title?: string;
  content?: string;
  contentType?: ContentType;
  status?: DocumentStatus;
  isFavorite?: boolean;
}

export async function updateDocument(
  id: string,
  patch: DocumentPatch,
): Promise<DocumentRecord | null> {
  return store.update((documents) => {
    const index = documents.findIndex((document) => document.id === id);
    if (index === -1) return { items: documents, result: null };

    const current = documents[index];
    const content =
      patch.content === undefined ? current.content : clampContent(patch.content);
    const title =
      patch.title === undefined ? current.title : normaliseTitle(patch.title, content);

    const updated: DocumentRecord = {
      ...current,
      title,
      content,
      wordCount: countWords(content),
      contentType: patch.contentType ?? current.contentType,
      status: patch.status ?? current.status,
      isFavorite: patch.isFavorite ?? current.isFavorite,
      updatedAt: new Date().toISOString(),
    };

    const items = [...documents];
    items[index] = updated;
    return { items, result: updated };
  });
}

/** Move to trash. Reversible, and the record keeps its deletion time. */
export async function moveDocumentToTrash(
  id: string,
): Promise<DocumentRecord | null> {
  return setDeletedAt(id, new Date().toISOString());
}

export async function restoreDocument(id: string): Promise<DocumentRecord | null> {
  return setDeletedAt(id, null);
}

function setDeletedAt(
  id: string,
  deletedAt: string | null,
): Promise<DocumentRecord | null> {
  return store.update((documents) => {
    const index = documents.findIndex((document) => document.id === id);
    if (index === -1) return { items: documents, result: null };

    const updated: DocumentRecord = { ...documents[index], deletedAt };
    const items = [...documents];
    items[index] = updated;
    return { items, result: updated };
  });
}

export async function deleteDocumentPermanently(id: string): Promise<boolean> {
  return store.update((documents) => {
    const items = documents.filter((document) => document.id !== id);
    return { items, result: items.length !== documents.length };
  });
}

/** Remove every trashed document, returning how many were removed. */
export async function emptyTrash(): Promise<number> {
  return store.update((documents) => {
    const items = documents.filter((document) => !document.deletedAt);
    return { items, result: documents.length - items.length };
  });
}
