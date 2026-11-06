import { NextResponse } from "next/server";
import { generateOutline } from "@/lib/ai/generate";
import { resolveBrandVoiceText } from "@/lib/brand-voice/store";
import { validateBrief } from "@/lib/ai/validation";
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

export async function POST(request: Request) {
  const notConfigured = guardAiConfigured();
  if (notConfigured) return notConfigured;

  if (!checkRateLimit(`outline:${clientKey(request)}`)) {
    return jsonError("Too many requests. Wait a moment and try again.", 429);
  }

  const body = await readJson(request);
  if (body === null) {
    return jsonError("The request body must be valid JSON.", 400);
  }

  const validated = validateBrief(body);
  if (!validated.ok) {
    return jsonError("Please correct the highlighted fields.", 400, validated.errors);
  }

  try {
    const brandVoice = await resolveBrandVoiceText(validated.value.brandVoiceId);
    const { outline, meta } = await generateOutline({ ...validated.value, brandVoice });
    await recordUsage({
      operation: "outline",
      model: meta.model,
      inputTokens: meta.inputTokens,
      outputTokens: meta.outputTokens,
    });
    return NextResponse.json({ outline });
  } catch (error) {
    return handleRouteError(error);
  }
}
