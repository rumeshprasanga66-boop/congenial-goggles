import type { SearchResult } from "./search";

/**
 * Research summarisation.
 *
 * The model is given the sources and asked to synthesise them, citing each
 * claim with a bracketed number. The prompt forbids anything the sources do not
 * support, and `parseCitations` checks afterwards which sources were actually
 * used, so the UI can tell the writer what the summary rests on. A summary with
 * no citations is shown as such rather than passed off as sourced.
 */

export interface SummariseInput {
  question: string;
  results: SearchResult[];
}

export interface SummarisedSource extends SearchResult {
  /** 1-based index as shown to the model and the writer. */
  index: number;
}

export function buildSummarisePrompt(input: SummariseInput): {
  system: string;
  user: string;
} {
  const sources = input.results
    .map(
      (result, index) =>
        `[${index + 1}] ${result.title}\nURL: ${result.url}\nExcerpt: ${
          result.snippet || "(the provider returned no excerpt for this result)"
        }`,
    )
    .join("\n\n");

  const system = [
    "You summarise web sources for a writer.",
    "Use only the numbered sources provided. Do not add facts, figures, names or claims that are not in them.",
    "Cite every substantive claim with its source number in square brackets, like [1] or [2][3].",
    "If the sources disagree, say so and cite both.",
    "If the sources do not answer the question, say that plainly instead of filling the gap.",
    "Write 2 to 4 short paragraphs. Plain prose, no headings, no bullet lists, no preamble.",
  ].join(" ");

  const user = [`Question: ${input.question}`, "", "Sources:", "", sources].join("\n");

  return { system, user };
}

/**
 * Which source numbers a summary actually cites, in ascending order, ignoring
 * numbers that do not correspond to a provided source.
 */
export function parseCitations(summary: string, sourceCount: number): number[] {
  const found = new Set<number>();
  for (const match of summary.matchAll(/\[(\d{1,2})\]/g)) {
    const index = Number(match[1]);
    if (index >= 1 && index <= sourceCount) found.add(index);
  }
  return [...found].sort((a, b) => a - b);
}

/** Attach 1-based indices so the UI and the prompt agree on numbering. */
export function indexSources(results: SearchResult[]): SummarisedSource[] {
  return results.map((result, index) => ({ ...result, index: index + 1 }));
}
