/**
 * SEO analysis.
 *
 * Everything here is computed from the text itself. No model is involved, so
 * the numbers are reproducible and can be trusted: the same input always yields
 * the same report. Where a check depends on a judgement the app cannot make
 * (whether a keyword is the *right* one to target), the report says what it
 * measured rather than asserting a quality it cannot verify.
 */

export interface SeoInput {
  /** The text being analysed: title, headings and body together. */
  text: string;
  /** The primary phrase the writer wants to rank for. */
  keyword: string;
  /** Optional secondary phrases. */
  secondaryKeywords?: string[];
}

export type CheckStatus = "pass" | "warn" | "fail";

export interface SeoCheck {
  id: string;
  label: string;
  status: CheckStatus;
  /** What was measured, in plain language. */
  detail: string;
  /** One actionable sentence, present when the check is not a pass. */
  advice?: string;
}

export interface SeoHeading {
  level: number;
  text: string;
}

export interface SeoReport {
  wordCount: number;
  readingTimeMinutes: number;
  /** 0-100. Composite of the checks below; not a prediction of ranking. */
  score: number;
  keyword: string;
  keywordCount: number;
  /** Count / words, as a percentage, rounded to one decimal. */
  keywordDensity: number;
  keywordInTitle: boolean;
  keywordInFirstParagraph: boolean;
  keywordInHeadings: boolean;
  secondaryCoverage: Array<{ keyword: string; count: number; present: boolean }>;
  headings: SeoHeading[];
  /** True when heading levels skip a step (an h2 followed by an h4). */
  headingOrderIssues: string[];
  checks: SeoCheck[];
}

/** Words that carry no topical weight, used when checking keyword presence. */
const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from", "had",
  "has", "have", "he", "her", "his", "how", "i", "if", "in", "into", "is", "it",
  "its", "me", "my", "no", "not", "of", "on", "or", "our", "out", "she", "so",
  "that", "the", "their", "them", "then", "there", "these", "they", "this", "to",
  "up", "was", "we", "were", "what", "when", "where", "which", "who", "why",
  "will", "with", "you", "your",
]);

export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Strip markdown syntax so word counts and keyword matching measure prose, not
 * markup. Without this, "#" counts as a word and a heading skews the density
 * figure; a keyword inside a link URL would be counted as body text.
 */
export function toPlainText(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s{0,3}(?:[-*+]|\d+\.)\s+/gm, "")
    .replace(/(\*\*|__|\*|_)/g, "");
}

/** Word count of the prose, ignoring markdown markers. */
export function countProseWords(text: string): number {
  return countWords(toPlainText(text));
}

/** Normalise a phrase for matching: lowercase, collapse whitespace. */
export function normaliseKeyword(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Count occurrences of a phrase, case-insensitively and on word boundaries.
 *
 * A plain `indexOf` would count "art" inside "start", which would inflate every
 * density figure, so matches are bounded by non-word characters.
 */
export function countPhraseOccurrences(text: string, phrase: string): number {
  const needle = normaliseKeyword(phrase);
  if (!needle) return 0;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "giu");
  return (toPlainText(text).match(pattern) ?? []).length;
}

/** Extract markdown ATX headings ("## Heading") in document order. */
export function extractHeadings(text: string): SeoHeading[] {
  const headings: SeoHeading[] = [];
  for (const line of text.split(/\r?\n/)) {
    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line.trim());
    if (match) {
      headings.push({ level: match[1]!.length, text: match[2]!.trim() });
    }
  }
  return headings;
}

/** The first non-empty, non-heading line, treated as the opening paragraph. */
export function firstParagraph(text: string): string {
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    return line;
  }
  return "";
}

/** The first heading of any level, treated as the article title. */
export function extractTitle(text: string): string {
  const headings = extractHeadings(text);
  if (headings.length > 0) return headings[0]!.text;
  return firstParagraph(text);
}

/**
 * Content words from a phrase, used to check whether a heading is about the
 * topic without demanding an exact phrase match.
 */
function contentWords(phrase: string): string[] {
  return normaliseKeyword(phrase)
    .split(" ")
    .filter((word) => word && !STOP_WORDS.has(word));
}

function headingCoversKeyword(heading: string, keyword: string): boolean {
  const words = contentWords(keyword);
  if (words.length === 0) return false;
  const haystack = normaliseKeyword(heading);
  return words.every((word) => countPhraseOccurrences(haystack, word) > 0);
}

/**
 * Detect heading levels that skip a step, which breaks document outline order.
 * An h1 is not required to be first: the page supplies one in its header.
 */
export function findHeadingOrderIssues(headings: SeoHeading[]): string[] {
  const issues: string[] = [];
  let previous = 1;
  for (const heading of headings) {
    if (heading.level > previous + 1) {
      issues.push(
        `"${heading.text}" is an h${heading.level} but the previous heading was an h${previous}.`,
      );
    }
    previous = heading.level;
  }
  return issues;
}

function scoreFor(status: CheckStatus): number {
  return status === "pass" ? 1 : status === "warn" ? 0.5 : 0;
}

/**
 * Build the report. The score is the mean of the checks, rounded, so it moves
 * when the writer fixes something specific. It is a summary of these checks and
 * nothing more.
 */
export function analyseSeo(input: SeoInput): SeoReport {
  const text = input.text ?? "";
  const plain = toPlainText(text);
  const keyword = normaliseKeyword(input.keyword ?? "");
  const words = countWords(plain);
  const keywordCount = countPhraseOccurrences(plain, keyword);
  const keywordDensity =
    words > 0 ? Math.round((keywordCount / words) * 1000) / 10 : 0;

  const title = extractTitle(text);
  const opening = firstParagraph(text);
  const headings = extractHeadings(text);
  const bodyHeadings = headings.slice(1);

  const keywordInTitle = keyword.length > 0 && countPhraseOccurrences(title, keyword) > 0;
  const keywordInFirstParagraph =
    keyword.length > 0 && countPhraseOccurrences(opening, keyword) > 0;
  const keywordInHeadings =
    keyword.length > 0 &&
    bodyHeadings.some((heading) => headingCoversKeyword(heading.text, keyword));

  const secondaryCoverage = (input.secondaryKeywords ?? [])
    .map((entry) => normaliseKeyword(entry))
    .filter(Boolean)
    .map((entry) => {
      const count = countPhraseOccurrences(text, entry);
      return { keyword: entry, count, present: count > 0 };
    });

  const headingOrderIssues = findHeadingOrderIssues(headings);

  const checks: SeoCheck[] = [];

  if (!keyword) {
    checks.push({
      id: "keyword",
      label: "Target keyword",
      status: "fail",
      detail: "No keyword was given, so keyword checks cannot run.",
      advice: "Enter the phrase you want this piece to rank for.",
    });
  }

  checks.push({
    id: "word-count",
    label: "Length",
    status: words >= 300 ? "pass" : words >= 150 ? "warn" : "fail",
    detail: `${words} words.`,
    advice:
      words >= 300
        ? undefined
        : "Search results rarely reward thin pages. Aim for at least 300 words.",
  });

  if (keyword) {
    checks.push({
      id: "keyword-in-title",
      label: "Keyword in the title",
      status: keywordInTitle ? "pass" : "fail",
      detail: keywordInTitle
        ? "The title contains the keyword."
        : "The title does not contain the keyword.",
      advice: keywordInTitle
        ? undefined
        : "Work the keyword into the first heading, ideally near the start.",
    });

    checks.push({
      id: "keyword-in-opening",
      label: "Keyword in the opening",
      status: keywordInFirstParagraph ? "pass" : "warn",
      detail: keywordInFirstParagraph
        ? "The first paragraph mentions the keyword."
        : "The first paragraph does not mention the keyword.",
      advice: keywordInFirstParagraph
        ? undefined
        : "Mention the keyword once in the opening paragraph so the topic is clear early.",
    });

    checks.push({
      id: "keyword-in-headings",
      label: "Keyword in a heading",
      status: keywordInHeadings ? "pass" : "warn",
      detail: keywordInHeadings
        ? "At least one section heading is about the keyword."
        : "No section heading is about the keyword.",
      advice: keywordInHeadings
        ? undefined
        : "Add a section heading that covers the keyword. One is usually enough.",
    });

    const densityStatus: CheckStatus =
      keywordDensity === 0
        ? "fail"
        : keywordDensity < 0.3
          ? "warn"
          : keywordDensity <= 3
            ? "pass"
            : "warn";
    checks.push({
      id: "keyword-density",
      label: "Keyword density",
      status: densityStatus,
      detail: `${keywordCount} use${keywordCount === 1 ? "" : "s"} of the keyword in ${words} words (${keywordDensity}%).`,
      advice:
        densityStatus === "pass"
          ? undefined
          : keywordDensity > 3
            ? "This reads as repetition. Replace some uses with a synonym or a pronoun."
            : "Use the keyword where it reads naturally: the title, the opening and a heading.",
    });
  }

  checks.push({
    id: "headings",
    label: "Heading structure",
    status: headingOrderIssues.length === 0 ? "pass" : "warn",
    detail:
      headingOrderIssues.length === 0
        ? `${headings.length} heading${headings.length === 1 ? "" : "s"}, correctly nested.`
        : `${headingOrderIssues.length} heading level${headingOrderIssues.length === 1 ? "" : "s"} skip a step.`,
    advice:
      headingOrderIssues.length === 0
        ? undefined
        : "Do not skip heading levels; an h3 belongs under an h2.",
  });

  if (secondaryCoverage.length > 0) {
    const covered = secondaryCoverage.filter((entry) => entry.present).length;
    checks.push({
      id: "secondary-keywords",
      label: "Secondary phrases",
      status: covered === secondaryCoverage.length ? "pass" : covered > 0 ? "warn" : "fail",
      detail: `${covered} of ${secondaryCoverage.length} secondary phrases appear.`,
      advice:
        covered === secondaryCoverage.length
          ? undefined
          : "Add the missing phrases where they genuinely belong, or drop them from the list.",
    });
  }

  const score = Math.round(
    (checks.reduce((sum, check) => sum + scoreFor(check.status), 0) / checks.length) * 100,
  );

  return {
    wordCount: words,
    readingTimeMinutes: Math.max(1, Math.round(words / 220)),
    score,
    keyword,
    keywordCount,
    keywordDensity,
    keywordInTitle,
    keywordInFirstParagraph,
    keywordInHeadings,
    secondaryCoverage,
    headings,
    headingOrderIssues,
    checks,
  };
}

/** Convenience for colouring a score in the UI. */
export function scoreBand(score: number): "weak" | "fair" | "good" {
  if (score >= 80) return "good";
  if (score >= 55) return "fair";
  return "weak";
}
