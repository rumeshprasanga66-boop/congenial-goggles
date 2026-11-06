import { NextResponse } from "next/server";
import { generateSection } from "@/lib/ai/generate";
import { resolveBrandVoiceText } from "@/lib/brand-voice/store";
import { validateSectionRequest } from "@/lib/ai/validation";
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

  if (!checkRateLimit(`section:${clientKey(request)}`)) {
    return jsonError("Too many requests. Wait a moment and try again.", 429);
  }

  const body = await readJson(request);
  if (body === null) {
    return jsonError("The request body must be valid JSON.", 400);
  }

  const validated = validateSectionRequest(body);
  if (!validated.ok) {
    return jsonError("Please correct the highlighted fields.", 400, validated.errors);
  }

  try {
    const brandVoice = await resolveBrandVoiceText(validated.value.brief.brandVoiceId);
    const { text, meta } = await generateSection({
      ...validated.value,
      brief: { ...validated.value.brief, brandVoice },
    });
    await recordUsage({
      operation: "section",
      model: meta.model,
      inputTokens: meta.inputTokens,
      outputTokens: meta.outputTokens,
    });
    return NextResponse.json({ text });
  } catch (error) {
    return handleRouteError(error);
  }
}
