import "server-only";

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import type { ContentType, DocumentRecord, DocumentStatus } from "@/lib/types";
import { countWords } from "@/lib/format";
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
 * Writes are serialised through a promise queue and committed atomically via a
 * temporary file and rename, so a crash mid-write cannot leave a half-written
 * store. There is no multi-user isolation yet: every document belongs to the
 * same workspace. Accounts arrive with the Supabase adapter, and the library
 * says so rather than implying private data.
 */

export const STORAGE_KIND = "file" as const;

const DATA_DIR =
  process.env.NW_DATA_DIR?.trim() || path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "documents.json");

interface StoreShape {
  version: 1;
  documents: DocumentRecord[];
}

/** Serialises writes so two concurrent saves cannot clobber each other. */
let writeQueue: Promise<unknown> = Promise.resolve();
let cache: DocumentRecord[] | null = null;

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(task, task);
  // Keep the chain alive even if a task rejects.
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readStore(): Promise<DocumentRecord[]> {
  if (cache) return cache;
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as StoreShape;
    cache = Array.isArray(parsed.documents) ? parsed.documents : [];
  } catch (error) {
    // A missing file is the normal first-run case, not a failure.
    const code = (error as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") {
      console.error("Could not read the document store:", error);
    }
    cache = [];
  }
  return cache;
}

async function writeStore(documents: DocumentRecord[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  const temporary = `${STORE_PATH}.${process.pid}.tmp`;
  const payload: StoreShape = { version: 1, documents };
  await writeFile(temporary, JSON.stringify(payload, null, 2), "utf8");
  await rename(temporary, STORE_PATH);
  cache = documents;
}

function clampContent(content: string): string {
  return content.length > MAX_CONTENT_LENGTH
    ? content.slice(0, MAX_CONTENT_LENGTH)
    : content;
}

export async function listAllDocuments(): Promise<DocumentRecord[]> {
  const documents = await readStore();
  return [...documents];
}

export async function getDocument(id: string): Promise<DocumentRecord | null> {
  const documents = await readStore();
  return documents.find((document) => document.id === id) ?? null;
}

export async function createDocument(input: DocumentInput): Promise<DocumentRecord> {
  return enqueue(async () => {
    const documents = await readStore();
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

    await writeStore([document, ...documents]);
    return document;
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
  return enqueue(async () => {
    const documents = await readStore();
    const index = documents.findIndex((document) => document.id === id);
    if (index === -1) return null;

    const current = documents[index];
    const content =
      patch.content === undefined ? current.content : clampContent(patch.content);
    const title =
      patch.title === undefined
        ? current.title
        : normaliseTitle(patch.title, content);

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

    const next = [...documents];
    next[index] = updated;
    await writeStore(next);
    return updated;
  });
}

/** Move to trash. Reversible, and the record keeps its deletion time. */
export async function moveDocumentToTrash(
  id: string,
): Promise<DocumentRecord | null> {
  return enqueue(async () => {
    const documents = await readStore();
    const index = documents.findIndex((document) => document.id === id);
    if (index === -1) return null;

    const updated: DocumentRecord = {
      ...documents[index],
      deletedAt: new Date().toISOString(),
    };
    const next = [...documents];
    next[index] = updated;
    await writeStore(next);
    return updated;
  });
}

export async function restoreDocument(id: string): Promise<DocumentRecord | null> {
  return enqueue(async () => {
    const documents = await readStore();
    const index = documents.findIndex((document) => document.id === id);
    if (index === -1) return null;

    const updated: DocumentRecord = { ...documents[index], deletedAt: null };
    const next = [...documents];
    next[index] = updated;
    await writeStore(next);
    return updated;
  });
}

export async function deleteDocumentPermanently(id: string): Promise<boolean> {
  return enqueue(async () => {
    const documents = await readStore();
    const next = documents.filter((document) => document.id !== id);
    if (next.length === documents.length) return false;
    await writeStore(next);
    return true;
  });
}

/** Remove only the documents the user asked to empty, never everything by default. */
export async function emptyTrash(): Promise<number> {
  return enqueue(async () => {
    const documents = await readStore();
    const next = documents.filter((document) => !document.deletedAt);
    const removed = documents.length - next.length;
    if (removed > 0) await writeStore(next);
    return removed;
  });
}
