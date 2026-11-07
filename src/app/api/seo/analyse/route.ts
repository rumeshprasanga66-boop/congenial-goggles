import { NextResponse } from "next/server";
import { analyseSeo } from "@/lib/seo/analyse";
import { jsonError, readJson } from "@/lib/ai/route-utils";

export const runtime = "nodejs";

const MAX_TEXT_LENGTH = 60000;
const MAX_KEYWORD_LENGTH = 120;

/**
 * SEO analysis.
 *
 * This route does not call a model: the report is computed from the text, so it
 * works on any deployment and returns the same answer every time. It is not
 * behind the AI configuration guard for that reason.
 */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (body === null) {
    return jsonError("The request body must be valid JSON.", 400);
  }

  const input = body as Record<string, unknown>;
  const text = typeof input.text === "string" ? input.text : "";
  if (!text.trim()) {
    return jsonError("Paste or write some text to analyse.", 400);
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return jsonError(
      `The text must be ${MAX_TEXT_LENGTH.toLocaleString("en-US")} characters or fewer.`,
      400,
    );
  }

  const keyword = typeof input.keyword === "string" ? input.keyword.trim() : "";
  if (keyword.length > MAX_KEYWORD_LENGTH) {
    return jsonError(
      `The keyword must be ${MAX_KEYWORD_LENGTH} characters or fewer.`,
      400,
    );
  }

  const secondaryKeywords = Array.isArray(input.secondaryKeywords)
    ? input.secondaryKeywords
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter(Boolean)
        .slice(0, 20)
    : [];

  return NextResponse.json({
    report: analyseSeo({ text, keyword, secondaryKeywords }),
  });
}
