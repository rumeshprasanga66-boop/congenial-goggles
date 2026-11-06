import "server-only";

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
 * Phase 1 runs without Supabase, so every read returns an empty result set
 * instead of fabricated sample data. Components therefore exercise their real
 * empty states from day one. Phase 3 replaces the bodies of these functions
 * with Supabase queries scoped by the authenticated user; the signatures and
 * return types are already the final ones.
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
  return {
    metrics: {
      totalDocuments: 0,
      wordsWritten: 0,
      aiGenerations: 0,
      // Credits are unknown until billing exists; null renders as "—".
      availableCredits: null,
    },
    recentDocuments: [],
    notifications: [],
  };
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  return [];
}

export async function listFavoriteDocuments(): Promise<DocumentRecord[]> {
  return [];
}

export async function listTrashedDocuments(): Promise<DocumentRecord[]> {
  return [];
}

export async function listTemplates(): Promise<TemplateRecord[]> {
  return [];
}

export async function listBrandVoices(): Promise<BrandVoiceRecord[]> {
  return [];
}

export async function listUsageRecords(): Promise<UsageRecord[]> {
  return [];
}
