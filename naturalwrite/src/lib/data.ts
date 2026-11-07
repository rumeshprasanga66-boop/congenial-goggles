import "server-only";

import {
  favouriteDocuments,
  documentStats,
  queryDocuments,
  trashedDocuments,
} from "./documents/query";
import {
  getDocument,
  listAllDocuments,
} from "./documents/store";
import { listUsage } from "./usage";
import type {
  BrandVoiceRecord,
  DocumentRecord,
  TemplateRecord,
  UsageRecord,
  WorkspaceOverview,
} from "./types";

/**
 * Server-side data layer.
 *
 * Documents are persisted by the file-backed store, so saving genuinely works
 * today. Everything else still returns an empty result set rather than
 * fabricated sample data, and components render their real empty states.
 * Phase 5 replaces the remaining bodies with Supabase queries scoped by the
 * authenticated user; the signatures and return types are already final.
 */

/**
 * True while Supabase credentials are absent. The UI uses this to label
 * database-backed areas honestly instead of implying persistence exists.
 */
export const DEMO_MODE = !(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function getWorkspaceOverview(): Promise<WorkspaceOverview> {
  const documents = await listDocuments();
  const stats = documentStats(documents);

  return {
    metrics: {
      totalDocuments: stats.total,
      wordsWritten: stats.words,
      aiGenerations: (await listUsage()).length,
      // Credits are unknown until billing exists; null renders as "—".
      availableCredits: null,
    },
    recentDocuments: queryDocuments(documents, { sort: "updated_desc" }).slice(0, 5),
    notifications: [],
  };
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  return queryDocuments(await listAllDocuments());
}

export async function getDocumentById(id: string): Promise<DocumentRecord | null> {
  return getDocument(id);
}

export async function listFavoriteDocuments(): Promise<DocumentRecord[]> {
  return favouriteDocuments(await listAllDocuments());
}

export async function listTrashedDocuments(): Promise<DocumentRecord[]> {
  return trashedDocuments(await listAllDocuments());
}

export async function listTemplates(): Promise<TemplateRecord[]> {
  return [];
}

export async function listBrandVoices(): Promise<BrandVoiceRecord[]> {
  return [];
}

export async function listUsageRecords(): Promise<UsageRecord[]> {
  // Usage is recorded by the generation routes into an in-process log. Reading
  // it here means the usage page shows real requests as soon as they happen,
  // rather than waiting for the database in Phase 5.
  return listUsage();
}

/**
 * Whether the usage log survives a restart. It does not yet, so the usage page
 * says so instead of implying permanent history.
 */
export const USAGE_IS_DURABLE = false;
