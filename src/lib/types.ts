/**
 * Domain types shared by the data layer and the UI.
 *
 * These mirror the Supabase table shapes planned for Phase 3, so swapping the
 * data source later does not change any component props.
 */

export type ContentType =
  | "article"
  | "blog_post"
  | "email"
  | "business"
  | "essay"
  | "social"
  | "product"
  | "creative"
  | "other";

export type DocumentStatus = "draft" | "in_review" | "final";

export interface DocumentRecord {
  id: string;
  title: string;
  content: string;
  contentType: ContentType;
  wordCount: number;
  isFavorite: boolean;
  status: DocumentStatus;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  prompt: string;
  /** Built-in templates ship with the app; user templates are stored per user. */
  source: "builtin" | "user";
}

export interface BrandVoiceRecord {
  id: string;
  name: string;
  description: string;
  tone: string;
  audience: string;
  wordsToUse: string[];
  wordsToAvoid: string[];
  instructions: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsageRecord {
  id: string;
  operation: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  createdAt: string;
}

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  tone: "info" | "caution" | "danger";
  readAt: string | null;
  createdAt: string;
}

export interface WorkspaceMetrics {
  totalDocuments: number;
  wordsWritten: number;
  aiGenerations: number;
  availableCredits: number | null;
}

export interface WorkspaceOverview {
  metrics: WorkspaceMetrics;
  recentDocuments: DocumentRecord[];
  notifications: NotificationRecord[];
}
