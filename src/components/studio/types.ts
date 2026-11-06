import type { ContentType } from "@/lib/types";
import type { LengthId, ToneId } from "@/lib/ai/options";

/**
 * Client-side shape of a writing job in the studio.
 *
 * This is the state the browser owns between steps. It deliberately mirrors the
 * API payload, so what the user fills in is exactly what gets sent.
 */

export interface StudioBrief {
  topic: string;
  contentType: ContentType;
  tone: ToneId;
  audience: string;
  requirements: string;
  length: LengthId;
  customWords: number;
  /** Saved brand voice to apply, or an empty string for none. */
  brandVoiceId: string;
}

export const EMPTY_BRIEF: StudioBrief = {
  topic: "",
  contentType: "article",
  tone: "natural",
  audience: "",
  requirements: "",
  length: "medium",
  customWords: 900,
  brandVoiceId: "",
};

/** Build a brief from a template, keeping the user's own fields intact. */
export function briefFromTemplate(
  base: StudioBrief,
  template: {
    contentType: ContentType;
    tone: ToneId;
    length: LengthId;
    guidance: string;
    topicPrompt: string;
  },
): StudioBrief {
  return {
    ...base,
    contentType: template.contentType,
    tone: template.tone,
    length: template.length,
    requirements: template.guidance,
    topic: template.topicPrompt,
  };
}

export interface StudioSection {
  /** Stable key for React, independent of the title the user may edit. */
  id: string;
  title: string;
  summary: string;
  wordTarget: number;
  /** Null until the section has been generated. */
  text: string | null;
  status: "pending" | "writing" | "ready" | "error";
  error?: string;
}

export interface StudioOutline {
  title: string;
  sections: StudioSection[];
}

/** Steps are named so the stepper can render progress without guessing. */
export type StudioStep = "brief" | "outline" | "draft";

export const STUDIO_STEPS: Array<{ id: StudioStep; label: string }> = [
  { id: "brief", label: "Brief" },
  { id: "outline", label: "Outline" },
  { id: "draft", label: "Draft" },
];

export function sectionId(): string {
  return `s_${Math.random().toString(36).slice(2, 10)}`;
}
