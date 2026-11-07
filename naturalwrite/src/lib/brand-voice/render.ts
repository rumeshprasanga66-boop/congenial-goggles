import type { BrandVoiceRecord } from "@/lib/types";

/**
 * Rendering a brand voice into prompt guidance.
 *
 * Kept pure and separate from storage so the wording can be reviewed and tested
 * without a database. Returns an empty string when the voice says nothing, so
 * callers can treat "no guidance" and "empty guidance" the same way.
 */

/** The subset of a voice that matters when building a prompt. */
export type BrandVoiceGuidance = Pick<
  BrandVoiceRecord,
  "name" | "description" | "tone" | "audience" | "wordsToUse" | "wordsToAvoid" | "instructions"
>;

export function renderBrandVoice(voice: BrandVoiceGuidance): string {
  const lines: string[] = [];

  if (voice.description.trim()) lines.push(voice.description.trim());
  if (voice.tone.trim()) lines.push(`Tone: ${voice.tone.trim()}.`);
  if (voice.audience.trim()) lines.push(`Written for: ${voice.audience.trim()}.`);
  if (voice.wordsToUse.length > 0) {
    lines.push(`Prefer these words where they fit naturally: ${voice.wordsToUse.join(", ")}.`);
  }
  if (voice.wordsToAvoid.length > 0) {
    lines.push(`Never use these words: ${voice.wordsToAvoid.join(", ")}.`);
  }
  if (voice.instructions.trim()) lines.push(voice.instructions.trim());

  return lines.join("\n");
}

/**
 * Whether a voice carries any actual guidance. Used by the UI to warn when a
 * voice is selected but empty, rather than silently doing nothing.
 */
export function brandVoiceIsEmpty(voice: BrandVoiceGuidance): boolean {
  return renderBrandVoice(voice).length === 0;
}
