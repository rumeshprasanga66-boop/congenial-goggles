import "server-only";

import { allocateWords, buildOutlinePrompt, buildSectionPrompt } from "./prompts";
import { complete, extractJson, type CompletionResult } from "./provider";
import type { ValidatedBrief, ValidatedSectionRequest } from "./validation";

/**
 * Generation orchestration: build a prompt, call the provider, and turn the raw
 * response into typed data the UI can render.
 *
 * The parsing functions are exported so they can be tested against real model
 * output shapes without making a network call.
 */

/** A validated brief plus the resolved brand voice text, ready for a prompt. */
export type GenerationBrief = ValidatedBrief & { brandVoice?: string };

/** A section request whose brief already carries resolved brand voice text. */
export type GenerationSectionRequest = Omit<ValidatedSectionRequest, "brief"> & {
  brief: GenerationBrief;
};

export interface OutlineSection {
  title: string;
  summary: string;
  wordTarget: number;
}

export interface Outline {
  title: string;
  sections: OutlineSection[];
}

interface RawOutline {
  title?: unknown;
  sections?: unknown;
}

/**
 * Normalise a title from model output. Returns an empty string when the value is
 * unusable, so the caller decides the fallback rather than this function
 * inventing a placeholder.
 */
function cleanTitle(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/^#+\s*/, "").replace(/^["'`]|["'`]$/g, "");
}

/** A section entry may be an object or a bare string; accept both shapes. */
function sectionFrom(entry: unknown): { title: string; summary: string } {
  if (typeof entry === "string") return { title: cleanTitle(entry), summary: "" };
  const item = (entry ?? {}) as Record<string, unknown>;
  return {
    title: cleanTitle(item.title),
    summary: typeof item.summary === "string" ? item.summary.trim() : "",
  };
}

/**
 * Parse an outline response. Sections without a usable title are dropped rather
 * than rendered as blank or fabricated rows, and word targets are recomputed
 * locally so the provider cannot make the totals inconsistent.
 */
export function parseOutline(text: string, brief: GenerationBrief): Outline | null {
  const raw = extractJson<RawOutline>(text);
  if (!raw || !Array.isArray(raw.sections)) return null;

  const sections = raw.sections
    .map(sectionFrom)
    .filter((section) => section.title.length > 0)
    .slice(0, 7);

  if (sections.length === 0) return null;

  const targets = allocateWords(brief.targetWords, sections);
  return {
    title: cleanTitle(raw.title) || brief.topic,
    sections: sections.map((section, index) => ({
      ...section,
      wordTarget: targets[index],
    })),
  };
}

/** Normalise model prose: strip stray markdown headings and fence markers. */
export function cleanProse(text: string): string {
  return text
    .replace(/^\s*```(?:markdown|md|text)?\s*/i, "")
    .replace(/\s*```\s*$/, "")
    .replace(/^#{1,6}\s+.*\n+/, "")
    .trim();
}

/**
 * Rewrites should not come back wrapped in a heading or fenced block, but the
 * model occasionally adds one. Same normalisation as prose, kept as its own name
 * so the intent at the call site is obvious.
 */
export const cleanRewriteText = cleanProse;

export interface GenerationMeta {
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export async function generateOutline(
  brief: GenerationBrief,
): Promise<{ outline: Outline; meta: GenerationMeta }> {
  const { system, user } = buildOutlinePrompt(brief);
  const result: CompletionResult = await complete(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { json: true, temperature: 0.6, maxTokens: 1200 },
  );

  const outline = parseOutline(result.text, brief);
  if (!outline) {
    throw new Error("The model did not return a usable outline. Try again.");
  }

  return {
    outline,
    meta: {
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    },
  };
}

export async function generateSection(
  request: GenerationSectionRequest,
): Promise<{ text: string; meta: GenerationMeta }> {
  const { system, user } = buildSectionPrompt(
    request.brief,
    {
      title: request.sectionTitle,
      summary: request.sectionSummary,
      priorContext: request.priorContext,
    },
    request.sectionWordTarget,
  );

  const result = await complete(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { temperature: 0.7, maxTokens: 2000 },
  );

  return {
    text: cleanProse(result.text),
    meta: {
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    },
  };
}
