import "server-only";

import { extractJson } from "./provider";

/**
 * Parsing for brainstorm responses, kept out of the route file because Next.js
 * only allows a route module to export its handlers.
 */

export interface BrainstormIdea {
  title: string;
  note: string;
}

interface RawIdeas {
  ideas?: unknown;
}

/** Parse and normalise an ideas response, dropping entries without a title. */
export function parseIdeas(text: string): BrainstormIdea[] {
  const raw = extractJson<RawIdeas>(text);
  if (!raw || !Array.isArray(raw.ideas)) return [];
  return raw.ideas
    .map((entry) => {
      const item = (entry ?? {}) as Record<string, unknown>;
      return {
        title: typeof item.title === "string" ? item.title.trim() : "",
        note: typeof item.note === "string" ? item.note.trim() : "",
      };
    })
    .filter((idea) => idea.title.length > 0);
}
