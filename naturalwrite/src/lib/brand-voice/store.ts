import "server-only";

import { randomUUID } from "node:crypto";

import type { BrandVoiceRecord } from "@/lib/types";
import { createJsonStore } from "@/lib/store/json-store";
import { renderBrandVoice } from "./render";

/**
 * Brand voice storage.
 *
 * A brand voice is a reusable description of how a piece of writing should
 * sound, applied to generation prompts. Records persist to a JSON file on the
 * server, using the same atomic store as documents.
 */

export const MAX_NAME_LENGTH = 80;
export const MAX_DESCRIPTION_LENGTH = 400;
export const MAX_INSTRUCTIONS_LENGTH = 2000;
export const MAX_WORDS_PER_LIST = 40;

const store = createJsonStore<BrandVoiceRecord>("brand-voices.json");

export interface BrandVoiceInput {
  name: string;
  description?: string;
  tone?: string;
  audience?: string;
  /** Accepts an array or a comma/newline separated string. */
  wordsToUse?: string[] | string;
  wordsToAvoid?: string[] | string;
  instructions?: string;
}

/**
 * Normalise a comma- or newline-separated list of words into a clean array.
 * Duplicates are removed case-insensitively, because repeating a word in the
 * prompt adds nothing.
 */
export function parseWordList(input: string | string[] | undefined): string[] {
  if (!input) return [];
  const raw = Array.isArray(input) ? input : input.split(/[,\n]/);
  const seen = new Set<string>();
  const words: string[] = [];

  for (const entry of raw) {
    const word = entry.trim();
    if (!word) continue;
    const key = word.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    words.push(word);
    if (words.length >= MAX_WORDS_PER_LIST) break;
  }
  return words;
}

function clamp(value: string | undefined, max: number): string {
  const trimmed = (value ?? "").trim();
  return trimmed.length > max ? trimmed.slice(0, max).trimEnd() : trimmed;
}

export async function listBrandVoices(): Promise<BrandVoiceRecord[]> {
  const voices = await store.read();
  return [...voices].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
}

export async function getBrandVoice(id: string): Promise<BrandVoiceRecord | null> {
  const voices = await store.read();
  return voices.find((voice) => voice.id === id) ?? null;
}

export async function createBrandVoice(
  input: BrandVoiceInput,
): Promise<BrandVoiceRecord> {
  return store.update((voices) => {
    const now = new Date().toISOString();
    const record: BrandVoiceRecord = {
      id: randomUUID(),
      name: clamp(input.name, MAX_NAME_LENGTH),
      description: clamp(input.description, MAX_DESCRIPTION_LENGTH),
      tone: clamp(input.tone, MAX_NAME_LENGTH),
      audience: clamp(input.audience, MAX_NAME_LENGTH),
      wordsToUse: parseWordList(input.wordsToUse),
      wordsToAvoid: parseWordList(input.wordsToAvoid),
      instructions: clamp(input.instructions, MAX_INSTRUCTIONS_LENGTH),
      createdAt: now,
      updatedAt: now,
    };
    return { items: [record, ...voices], result: record };
  });
}

export async function updateBrandVoice(
  id: string,
  input: Partial<BrandVoiceInput>,
): Promise<BrandVoiceRecord | null> {
  return store.update((voices) => {
    const index = voices.findIndex((voice) => voice.id === id);
    if (index === -1) return { items: voices, result: null };

    const current = voices[index];
    const updated: BrandVoiceRecord = {
      ...current,
      name: input.name === undefined ? current.name : clamp(input.name, MAX_NAME_LENGTH),
      description:
        input.description === undefined
          ? current.description
          : clamp(input.description, MAX_DESCRIPTION_LENGTH),
      tone: input.tone === undefined ? current.tone : clamp(input.tone, MAX_NAME_LENGTH),
      audience:
        input.audience === undefined
          ? current.audience
          : clamp(input.audience, MAX_NAME_LENGTH),
      wordsToUse:
        input.wordsToUse === undefined ? current.wordsToUse : parseWordList(input.wordsToUse),
      wordsToAvoid:
        input.wordsToAvoid === undefined
          ? current.wordsToAvoid
          : parseWordList(input.wordsToAvoid),
      instructions:
        input.instructions === undefined
          ? current.instructions
          : clamp(input.instructions, MAX_INSTRUCTIONS_LENGTH),
      updatedAt: new Date().toISOString(),
    };

    const items = [...voices];
    items[index] = updated;
    return { items, result: updated };
  });
}

export async function deleteBrandVoice(id: string): Promise<boolean> {
  return store.update((voices) => {
    const items = voices.filter((voice) => voice.id !== id);
    return { items, result: items.length !== voices.length };
  });
}

/**
 * Resolve a saved voice into prompt guidance. An unknown or missing id yields an
 * empty string rather than an error: a voice that was deleted after a draft was
 * started should not block generation.
 */
export async function resolveBrandVoiceText(id?: string): Promise<string> {
  if (!id) return "";
  const voice = await getBrandVoice(id);
  return voice ? renderBrandVoice(voice) : "";
}
