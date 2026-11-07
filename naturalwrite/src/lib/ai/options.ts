import type { ContentType } from "@/lib/types";

/**
 * Shared vocabulary for the writing studio.
 *
 * The UI and the prompt builders both read from here, so the options a user can
 * pick are always exactly the options the prompts understand. Adding a tone
 * means adding it in one place.
 */

export type ToneId =
  | "natural"
  | "professional"
  | "friendly"
  | "persuasive"
  | "authoritative"
  | "conversational"
  | "academic"
  | "inspirational"
  | "direct";

export type LengthId = "short" | "medium" | "long" | "custom";

export interface Option<T extends string> {
  id: T;
  label: string;
  description: string;
}

export const TONES: Array<Option<ToneId>> = [
  { id: "natural", label: "Natural", description: "Reads like a person wrote it, not a machine" },
  { id: "professional", label: "Professional", description: "Clear and businesslike without being stiff" },
  { id: "friendly", label: "Friendly", description: "Warm and approachable" },
  { id: "persuasive", label: "Persuasive", description: "Argues a point and moves the reader to act" },
  { id: "authoritative", label: "Authoritative", description: "Confident and well informed" },
  { id: "conversational", label: "Conversational", description: "Relaxed, as if talking to one reader" },
  { id: "academic", label: "Academic", description: "Formal and precise, suited to research writing" },
  { id: "inspirational", label: "Inspirational", description: "Uplifting and motivating" },
  { id: "direct", label: "Direct", description: "Short sentences, no filler" },
];

export const LENGTHS: Array<Option<LengthId>> = [
  { id: "short", label: "Short", description: "About 400 words" },
  { id: "medium", label: "Medium", description: "About 900 words" },
  { id: "long", label: "Long", description: "About 1,800 words" },
  { id: "custom", label: "Custom", description: "You choose the word count" },
];

export interface ContentTypeOption extends Option<ContentType> {
  /** Sensible default section shape used when planning an outline. */
  defaultSections: string[];
}

export const CONTENT_TYPES: ContentTypeOption[] = [
  {
    id: "article",
    label: "Article",
    description: "A researched, structured piece",
    defaultSections: ["Introduction", "Background", "Main points", "Conclusion"],
  },
  {
    id: "blog_post",
    label: "Blog post",
    description: "Informal and readable, written to be found",
    defaultSections: ["Hook", "Why this matters", "Practical advice", "Takeaway"],
  },
  {
    id: "email",
    label: "Email",
    description: "A message with a clear purpose",
    defaultSections: ["Subject line", "Opening", "Body", "Call to action"],
  },
  {
    id: "business",
    label: "Business document",
    description: "Reports, proposals and briefs",
    defaultSections: ["Summary", "Context", "Findings", "Recommendations"],
  },
  {
    id: "essay",
    label: "Essay",
    description: "An argued piece of writing",
    defaultSections: ["Thesis", "Argument", "Counterpoint", "Conclusion"],
  },
  {
    id: "social",
    label: "Social post",
    description: "Short-form content for a feed",
    defaultSections: ["Hook", "Core message", "Call to action"],
  },
  {
    id: "product",
    label: "Product description",
    description: "Copy that explains and sells",
    defaultSections: ["What it is", "Who it is for", "Key benefits", "Next step"],
  },
  {
    id: "creative",
    label: "Creative writing",
    description: "Stories and narrative prose",
    defaultSections: ["Opening", "Development", "Turn", "Resolution"],
  },
  {
    id: "other",
    label: "Other",
    description: "Something that does not fit the list",
    defaultSections: ["Introduction", "Body", "Conclusion"],
  },
];

const toneIds = new Set<string>(TONES.map((tone) => tone.id));
const lengthIds = new Set<string>(LENGTHS.map((length) => length.id));
const contentTypeIds = new Set<string>(CONTENT_TYPES.map((type) => type.id));

export function isToneId(value: unknown): value is ToneId {
  return typeof value === "string" && toneIds.has(value);
}

export function isLengthId(value: unknown): value is LengthId {
  return typeof value === "string" && lengthIds.has(value);
}

export function isContentType(value: unknown): value is ContentType {
  return typeof value === "string" && contentTypeIds.has(value);
}

export function getContentType(id: ContentType): ContentTypeOption {
  return (
    CONTENT_TYPES.find((type) => type.id === id) ??
    CONTENT_TYPES[CONTENT_TYPES.length - 1]
  );
}

export function getTone(id: ToneId): Option<ToneId> {
  return TONES.find((tone) => tone.id === id) ?? TONES[0];
}

export const MIN_CUSTOM_WORDS = 150;
export const MAX_CUSTOM_WORDS = 5000;

export function clampWordCount(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return 900;
  return Math.min(MAX_CUSTOM_WORDS, Math.max(MIN_CUSTOM_WORDS, Math.round(numeric)));
}

/** Word-count target for a length choice. Custom lengths supply their own. */
export function targetWordCount(length: LengthId, custom?: number): number {
  switch (length) {
    case "short":
      return 400;
    case "medium":
      return 900;
    case "long":
      return 1800;
    case "custom":
      return clampWordCount(custom);
  }
}
