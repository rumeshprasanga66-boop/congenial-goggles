import { NextResponse } from "next/server";
import { complete } from "@/lib/ai/provider";
import { guardAiConfigured, handleRouteError, jsonError, readJson } from "@/lib/ai/route-utils";
import { recordUsage } from "@/lib/usage";
import { buildSummarisePrompt, indexSources, parseCitations } from "@/lib/research/summarize";
import type { SearchResult } from "@/lib/research/search";

export const runtime = "nodejs";

const MAX_QUESTION_LENGTH = 400;
const MAX_SOURCES = 8;

/**
 * Summarise a set of search results.
 *
 * The sources arrive from the browser rather than being re-fetched, so the
 * writer can see exactly what is being summarised. The model is told to cite
 * each claim, and the response reports which citations survived, so the UI can
 * flag a summary that rests on nothing.
 */
export async function POST(request: Request) {
  const guard = guardAiConfigured();
  if (guard) return guard;

  const body = await readJson(request);
  if (body === null) {
    return jsonError("The request body must be valid JSON.", 400);
  }

  const input = body as Record<string, unknown>;
  const question = typeof input.question === "string" ? input.question.trim() : "";
  if (!question) {
    return jsonError("A question is required to summarise against.", 400);
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return jsonError(`The question must be ${MAX_QUESTION_LENGTH} characters or fewer.`, 400);
  }

  if (!Array.isArray(input.results) || input.results.length === 0) {
    return jsonError("At least one source is required to summarise.", 400);
  }

  const results: SearchResult[] = input.results
    .slice(0, MAX_SOURCES)
    .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    .map((entry) => ({
      title: typeof entry.title === "string" ? entry.title : "Untitled source",
      url: typeof entry.url === "string" ? entry.url : "",
      snippet: typeof entry.snippet === "string" ? entry.snippet : "",
      publishedDate: typeof entry.publishedDate === "string" ? entry.publishedDate : null,
    }))
    .filter((result) => result.url);

  if (results.length === 0) {
    return jsonError("None of the supplied sources had a usable URL.", 400);
  }

  const prompt = buildSummarisePrompt({ question, results });

  try {
    const completion = await complete(
      [
        { role: "system", content: prompt.system },
        { role: "user", content: prompt.user },
      ],
      { temperature: 0.2, maxTokens: 900 },
    );

    await recordUsage({
      operation: "research.summarize",
      model: completion.model,
      inputTokens: completion.inputTokens,
      outputTokens: completion.outputTokens,
    });

    const summary = completion.text.trim();
    const cited = parseCitations(summary, results.length);

    return NextResponse.json({
      summary,
      citedSources: cited,
      sources: indexSources(results),
      model: completion.model,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
