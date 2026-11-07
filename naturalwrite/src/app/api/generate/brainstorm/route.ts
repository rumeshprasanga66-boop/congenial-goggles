import { NextResponse } from "next/server";
import { buildBrainstormPrompt, isBrainstormKind } from "@/lib/ai/prompts";
import { parseIdeas } from "@/lib/ai/brainstorm";
import { resolveBrandVoiceText } from "@/lib/brand-voice/store";
import { complete } from "@/lib/ai/provider";
import { recordUsage } from "@/lib/usage";
import {
  checkRateLimit,
  clientKey,
  guardAiConfigured,
  handleRouteError,
  jsonError,
  readJson,
} from "@/lib/ai/route-utils";

export const runtime = "nodejs";

const MAX_SUBJECT_LENGTH = 300;
const MIN_IDEAS = 3;
const MAX_IDEAS = 20;

export async function POST(request: Request) {
  const notConfigured = guardAiConfigured();
  if (notConfigured) return notConfigured;

  if (!checkRateLimit(`brainstorm:${clientKey(request)}`)) {
    return jsonError("Too many requests. Wait a moment and try again.", 429);
  }

  const body = await readJson(request);
  if (body === null) {
    return jsonError("The request body must be valid JSON.", 400);
  }

  const input = body as Record<string, unknown>;
  const subject = typeof input.subject === "string" ? input.subject.trim() : "";
  if (!subject) {
    return jsonError("Enter a subject to brainstorm around.", 400);
  }
  if (subject.length > MAX_SUBJECT_LENGTH) {
    return jsonError(`The subject must be ${MAX_SUBJECT_LENGTH} characters or fewer.`, 400);
  }
  if (!isBrainstormKind(input.kind)) {
    return jsonError("Choose what to generate.", 400);
  }

  const requestedCount = Number(input.count);
  const count = Number.isFinite(requestedCount)
    ? Math.min(MAX_IDEAS, Math.max(MIN_IDEAS, Math.round(requestedCount)))
    : 10;

  const brandVoiceId =
    typeof input.brandVoiceId === "string" ? input.brandVoiceId : undefined;

  try {
    const brandVoice = await resolveBrandVoiceText(brandVoiceId);
    const { system, user } = buildBrainstormPrompt(subject, input.kind, count, brandVoice);
    const result = await complete(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { json: true, temperature: 0.8, maxTokens: 1500 },
    );
    const ideas = parseIdeas(result.text);
    if (ideas.length === 0) {
      return jsonError("The model did not return usable ideas. Try again.", 502);
    }
    await recordUsage({
      operation: `brainstorm:${input.kind}`,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    });
    return NextResponse.json({ ideas });
  } catch (error) {
    return handleRouteError(error);
  }
}
