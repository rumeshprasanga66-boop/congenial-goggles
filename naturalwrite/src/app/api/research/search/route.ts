import { NextResponse } from "next/server";
import {
  isResearchConfigured,
  searchWeb,
  ResearchNotConfiguredError,
  ResearchRequestError,
} from "@/lib/research/search";
import { jsonError, readJson } from "@/lib/ai/route-utils";

export const runtime = "nodejs";

const MAX_QUERY_LENGTH = 400;

/**
 * Web search for the research assistant.
 *
 * This is a separate provider from the model, so it has its own configuration
 * check and its own error vocabulary. It never returns placeholder results.
 */
export async function POST(request: Request) {
  if (!isResearchConfigured()) {
    return jsonError(
      "Research is not configured on this deployment. An administrator needs to set TAVILY_API_KEY or BRAVE_SEARCH_API_KEY.",
      503,
    );
  }

  const body = await readJson(request);
  if (body === null) {
    return jsonError("The request body must be valid JSON.", 400);
  }

  const input = body as Record<string, unknown>;
  const query = typeof input.query === "string" ? input.query.trim() : "";
  if (!query) {
    return jsonError("Enter a question or phrase to search for.", 400);
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return jsonError(`The query must be ${MAX_QUERY_LENGTH} characters or fewer.`, 400);
  }

  const count = typeof input.count === "number" ? input.count : undefined;

  try {
    const response = await searchWeb(query, { count });
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ResearchNotConfiguredError) {
      return jsonError(error.message, 503);
    }
    if (error instanceof ResearchRequestError) {
      const status = error.status === 429 ? 429 : error.status === 400 ? 400 : 502;
      return jsonError(error.message, status);
    }
    return jsonError("Something went wrong while searching.", 500);
  }
}
