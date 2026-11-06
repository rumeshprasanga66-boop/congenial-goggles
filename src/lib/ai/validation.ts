import {
  clampWordCount,
  isContentType,
  isLengthId,
  isToneId,
  targetWordCount,
  type LengthId,
  type ToneId,
} from "./options";
import type { ContentType } from "@/lib/types";

/**
 * Request validation for the generation API.
 *
 * The route handler receives untrusted JSON, so every field is checked here
 * before it reaches a prompt. Returning a typed result instead of throwing lets
 * the route report exactly which field was wrong.
 */

export interface ValidatedBrief {
  topic: string;
  contentType: ContentType;
  tone: ToneId;
  audience: string;
  requirements: string;
  length: LengthId;
  customWords?: number;
  targetWords: number;
  language: string;
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] };

const MAX_TOPIC_LENGTH = 500;
const MAX_AUDIENCE_LENGTH = 300;
const MAX_REQUIREMENTS_LENGTH = 2000;

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateBrief(input: unknown): ValidationResult<ValidatedBrief> {
  const errors: string[] = [];
  const body = (input ?? {}) as Record<string, unknown>;

  const topic = asString(body.topic);
  if (!topic) {
    errors.push("A topic is required.");
  } else if (topic.length > MAX_TOPIC_LENGTH) {
    errors.push(`The topic must be ${MAX_TOPIC_LENGTH} characters or fewer.`);
  }

  const contentTypeRaw = body.contentType ?? "article";
  if (!isContentType(contentTypeRaw)) {
    errors.push("That content type is not recognised.");
  }

  const toneRaw = body.tone ?? "natural";
  if (!isToneId(toneRaw)) {
    errors.push("That tone is not recognised.");
  }

  const lengthRaw = body.length ?? "medium";
  if (!isLengthId(lengthRaw)) {
    errors.push("That length is not recognised.");
  }

  const audience = asString(body.audience);
  if (audience.length > MAX_AUDIENCE_LENGTH) {
    errors.push(`The audience must be ${MAX_AUDIENCE_LENGTH} characters or fewer.`);
  }

  const requirements = asString(body.requirements);
  if (requirements.length > MAX_REQUIREMENTS_LENGTH) {
    errors.push(
      `Additional requirements must be ${MAX_REQUIREMENTS_LENGTH} characters or fewer.`,
    );
  }

  const language = asString(body.language) || "English";

  let customWords: number | undefined;
  if (lengthRaw === "custom") {
    const raw = body.customWords;
    const numeric = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isFinite(numeric)) {
      errors.push("A custom length needs a word count.");
    } else if (numeric < 150 || numeric > 5000) {
      errors.push("The custom word count must be between 150 and 5000.");
    } else {
      customWords = clampWordCount(numeric);
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  const length = lengthRaw as LengthId;
  return {
    ok: true,
    value: {
      topic,
      contentType: contentTypeRaw as ContentType,
      tone: toneRaw as ToneId,
      audience,
      requirements,
      length,
      customWords,
      targetWords: targetWordCount(length, customWords),
      language,
    },
  };
}

export interface ValidatedSectionRequest {
  brief: ValidatedBrief;
  sectionTitle: string;
  sectionSummary: string;
  sectionWordTarget: number;
  priorContext: string;
}

const MAX_SECTION_TITLE = 200;
const MAX_SECTION_SUMMARY = 600;
const MAX_PRIOR_CONTEXT = 6000;

export function validateSectionRequest(
  input: unknown,
): ValidationResult<ValidatedSectionRequest> {
  const body = (input ?? {}) as Record<string, unknown>;
  const briefResult = validateBrief(body.brief);
  if (!briefResult.ok) return briefResult;

  const errors: string[] = [];
  const sectionTitle = asString(body.sectionTitle);
  if (!sectionTitle) {
    errors.push("A section title is required.");
  } else if (sectionTitle.length > MAX_SECTION_TITLE) {
    errors.push(`The section title must be ${MAX_SECTION_TITLE} characters or fewer.`);
  }

  const sectionSummary = asString(body.sectionSummary);
  if (sectionSummary.length > MAX_SECTION_SUMMARY) {
    errors.push(`The section summary must be ${MAX_SECTION_SUMMARY} characters or fewer.`);
  }

  const priorContext = asString(body.priorContext).slice(-MAX_PRIOR_CONTEXT);

  const target = Number(body.sectionWordTarget);
  const sectionWordTarget = Number.isFinite(target)
    ? clampWordCount(target)
    : Math.max(80, Math.round(briefResult.value.targetWords / 4));

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      brief: briefResult.value,
      sectionTitle,
      sectionSummary,
      sectionWordTarget,
      priorContext,
    },
  };
}
