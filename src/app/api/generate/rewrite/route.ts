import { NextResponse } from "next/server";
import { buildRewritePrompt, isRewriteAction } from "@/lib/ai/prompts";
import { isToneId } from "@/lib/ai/options";
import { cleanRewriteText } from "@/lib/ai/generate";
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

const MAX_TEXT_LENGTH = 12000;

export async function POST(request: Request) {
  const notConfigured = guardAiConfigured();
  if (notConfigured) return notConfigured;

  if (!checkRateLimit(`rewrite:${clientKey(request)}`)) {
    return jsonError("Too many requests. Wait a moment and try again.", 429);
  }

  const body = await readJson(request);
  if (body === null) {
    return jsonError("The request body must be valid JSON.", 400);
  }

  const input = body as Record<string, unknown>;
  const text = typeof input.text === "string" ? input.text.trim() : "";
  if (!text) {
    return jsonError("Paste some text to rewrite.", 400);
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return jsonError(
      `The text must be ${MAX_TEXT_LENGTH.toLocaleString("en-US")} characters or fewer.`,
      400,
    );
  }

  if (!isRewriteAction(input.action)) {
    return jsonError("Choose a rewrite action.", 400);
  }

  const tone = isToneId(input.tone) ? input.tone : undefined;
  const instructions =
    typeof input.instructions === "string" ? input.instructions : undefined;

  const brandVoiceId =
    typeof input.brandVoiceId === "string" ? input.brandVoiceId : undefined;

  try {
    const brandVoice = await resolveBrandVoiceText(brandVoiceId);
    const { system, user } = buildRewritePrompt(text, input.action, {
      tone,
      instructions,
      brandVoice,
    });
    const result = await complete(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { temperature: 0.5, maxTokens: 3000 },
    );
    await recordUsage({
      operation: `rewrite:${input.action}`,
      model: result.model,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
    });
    return NextResponse.json({
      text: cleanRewriteText(result.text),
      original: text,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
