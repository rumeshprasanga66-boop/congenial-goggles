import {
  getContentType,
  getTone,
  targetWordCount,
  type LengthId,
  type ToneId,
} from "./options";
import type { ContentType } from "@/lib/types";

/**
 * Prompt construction, kept separate from the network layer so it can be tested
 * and reviewed without an API key.
 *
 * These functions are pure: given the same brief they always produce the same
 * strings. Nothing here calls a provider.
 */

export interface WritingBrief {
  topic: string;
  contentType: ContentType;
  tone: ToneId;
  audience: string;
  /** Extra instruction from the user: points to cover, things to avoid. */
  requirements?: string;
  targetWords: number;
  /** Language the piece should be written in, e.g. "English". */
  language?: string;
  /** Optional brand voice guidance prepended to the system prompt. */
  brandVoice?: string;
}

export interface SectionBrief {
  title: string;
  /** Short direction for this section, from the outline step. */
  summary?: string;
  /** Words already accepted, so later sections stay consistent. */
  priorContext?: string;
}

/** House style applied to every generation. Deliberately explicit about AI tells. */
export const HOUSE_STYLE = [
  "Write in plain, natural English that sounds like a competent person wrote it.",
  "Avoid AI clichés: do not open with 'In today's fast-paced world', do not use 'delve', 'tapestry', 'testament to', 'landscape of', 'unlock the power', or 'it's important to note'.",
  "Do not use em dashes as a stylistic flourish.",
  "Prefer concrete nouns and active verbs over abstractions.",
  "Vary sentence length. Do not write three sentences of the same shape in a row.",
  "Never invent statistics, dates, quotations or sources. If a specific fact is needed but not supplied, write around it rather than fabricating it.",
].join("\n");

function briefLines(brief: WritingBrief): string[] {
  const lines = [
    `Topic: ${brief.topic}`,
    `Format: ${getContentType(brief.contentType).label}`,
    `Tone: ${getTone(brief.tone).label}`,
  ];
  if (brief.audience.trim()) lines.push(`Audience: ${brief.audience}`);
  lines.push(`Target length: about ${brief.targetWords} words in total`);
  if (brief.language?.trim()) lines.push(`Language: ${brief.language}`);
  if (brief.requirements?.trim()) lines.push(`Requirements: ${brief.requirements.trim()}`);
  return lines;
}

/**
 * Step 1: ask for a plan. Returning a structured outline first keeps the
 * structure cheap to change before any prose is written.
 */
export function buildOutlinePrompt(brief: WritingBrief): {
  system: string;
  user: string;
} {
  const defaults = getContentType(brief.contentType).defaultSections;
  const system = [
    "You are an experienced editor planning a piece of writing.",
    "Return only a JSON object. Do not wrap it in markdown fences and do not add commentary.",
    HOUSE_STYLE,
  ].join("\n\n");

  const user = [
    "Plan the structure for this piece.",
    "",
    briefLines(brief).join("\n"),
    "",
    `A typical ${getContentType(brief.contentType).label.toLowerCase()} has sections such as: ${defaults.join(", ")}.`,
    "Choose the sections that genuinely suit this topic rather than copying that list.",
    "",
    "Respond with JSON in exactly this shape:",
    '{"title": string, "sections": [{"title": string, "summary": string}]}',
    "Use 3 to 7 sections. Each summary is one sentence describing what that section covers.",
  ].join("\n");

  return { system, user };
}

/** Step 2: draft a single section, with earlier accepted text for continuity. */
export function buildSectionPrompt(
  brief: WritingBrief,
  section: SectionBrief,
  sectionWordTarget: number,
): { system: string; user: string } {
  const system = [
    "You are a skilled writer producing one section of a longer piece.",
    "Return only the prose for the section. Do not add a heading, notes, or commentary.",
    brief.brandVoice?.trim() ? `Brand voice to follow:\n${brief.brandVoice.trim()}` : "",
    HOUSE_STYLE,
  ]
    .filter(Boolean)
    .join("\n\n");

  const parts = [
    "Write this section.",
    "",
    briefLines(brief).join("\n"),
    "",
    `Section to write: ${section.title}`,
  ];
  if (section.summary?.trim()) parts.push(`What it should cover: ${section.summary.trim()}`);
  parts.push(`Length: about ${sectionWordTarget} words. Stay close to that.`);
  if (section.priorContext?.trim()) {
    parts.push(
      "",
      "Text already written for this piece. Match its voice and do not repeat it:",
      section.priorContext.trim(),
    );
  }
  parts.push("", "Return the prose only.");

  return { system, user: parts.join("\n") };
}

/** Standalone drafting: the whole piece in one call, used when no outline is wanted. */
export function buildDraftPrompt(brief: WritingBrief): { system: string; user: string } {
  const system = [
    "You are a skilled writer producing a complete piece.",
    "Return only the finished prose. Do not add commentary or notes.",
    brief.brandVoice?.trim() ? `Brand voice to follow:\n${brief.brandVoice.trim()}` : "",
    HOUSE_STYLE,
  ]
    .filter(Boolean)
    .join("\n\n");

  const user = [
    "Write the full piece.",
    "",
    briefLines(brief).join("\n"),
    "",
    "Structure it with clear sections. Return the prose only.",
  ].join("\n");

  return { system, user };
}

export const REWRITE_ACTIONS = {
  improve: "Improve the writing while keeping the meaning and roughly the same length.",
  simplify: "Simplify the language. Use shorter sentences and plainer words without losing meaning.",
  expand: "Expand this with more specific detail and examples that follow from the text.",
  shorten: "Cut this to about half its length while keeping every essential point.",
  tone: "Rewrite this in a clearly different tone while keeping the content intact.",
  grammar: "Fix grammar, punctuation and awkward phrasing. Change nothing else.",
} as const;

export type RewriteAction = keyof typeof REWRITE_ACTIONS;

const rewriteActionIds = new Set<string>(Object.keys(REWRITE_ACTIONS));

export function isRewriteAction(value: unknown): value is RewriteAction {
  return typeof value === "string" && rewriteActionIds.has(value);
}

/** Rewrite prompt. The original text is passed through untouched. */
export function buildRewritePrompt(
  text: string,
  action: RewriteAction,
  options: { tone?: ToneId; instructions?: string } = {},
): { system: string; user: string } {
  const system = [
    "You are an editor improving an existing piece of writing.",
    "Return only the revised text. Do not explain what you changed and do not add commentary.",
    "Never add facts, names, numbers or claims that were not in the original.",
    HOUSE_STYLE,
  ].join("\n\n");

  const parts: string[] = [REWRITE_ACTIONS[action]];
  if (action === "tone" && options.tone) {
    parts.push(`Target tone: ${getTone(options.tone).label}.`);
  }
  if (options.instructions?.trim()) {
    parts.push(`Additional instruction: ${options.instructions.trim()}`);
  }
  parts.push("", "Text to revise:", text.trim(), "", "Return the revised text only.");

  return { system, user: parts.join("\n") };
}

export const BRAINSTORM_KINDS = {
  topics: "Blog post and article topics",
  headlines: "Headlines and titles",
  outline: "A content outline",
  questions: "Research questions worth answering",
  angles: "Distinct angles on the subject",
} as const;

export type BrainstormKind = keyof typeof BRAINSTORM_KINDS;

const brainstormKindIds = new Set<string>(Object.keys(BRAINSTORM_KINDS));

export function isBrainstormKind(value: unknown): value is BrainstormKind {
  return typeof value === "string" && brainstormKindIds.has(value);
}

export function buildBrainstormPrompt(
  subject: string,
  kind: BrainstormKind,
  count = 10,
): { system: string; user: string } {
  const system = [
    "You are a strategist generating ideas for a writer.",
    "Return only a JSON object. No markdown fences and no commentary.",
    "Ideas must be specific to the subject given. Do not produce generic filler.",
  ].join("\n\n");

  const user = [
    `Subject: ${subject.trim()}`,
    `Generate: ${BRAINSTORM_KINDS[kind]}`,
    `How many: ${count}`,
    "",
    "Respond with JSON in exactly this shape:",
    '{"ideas": [{"title": string, "note": string}]}',
    "Each note is one sentence explaining the idea or how to approach it.",
  ].join("\n");

  return { system, user };
}

/**
 * Split a total word target across sections in proportion to how much each
 * section is likely to need. Intro and conclusion sections are weighted down.
 */
export function allocateWords(
  totalWords: number,
  sections: Array<{ title: string }>,
): number[] {
  if (sections.length === 0) return [];

  const weights = sections.map((section) => {
    const title = section.title.toLowerCase();
    if (/\b(intro|introduction|opening|hook|summary|abstract|conclusion|takeaway|call to action)\b/.test(title)) {
      return 0.7;
    }
    return 1;
  });

  const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
  const raw = weights.map((weight) => (totalWords * weight) / weightSum);

  // Round to the nearest 10 words, then correct any drift on the largest section
  // so the parts always add up to the requested total.
  const rounded = raw.map((value) => Math.max(40, Math.round(value / 10) * 10));
  const drift = totalWords - rounded.reduce((sum, value) => sum + value, 0);
  const largest = rounded.indexOf(Math.max(...rounded));
  rounded[largest] = Math.max(40, rounded[largest] + drift);

  return rounded;
}

export function lengthIdToWords(length: LengthId, custom?: number): number {
  return targetWordCount(length, custom);
}
