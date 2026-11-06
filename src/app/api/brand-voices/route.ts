import { NextResponse } from "next/server";
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_INSTRUCTIONS_LENGTH,
  MAX_NAME_LENGTH,
  createBrandVoice,
  listBrandVoices,
} from "@/lib/brand-voice/store";
import { jsonError, readJson } from "@/lib/ai/route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/brand-voices — every saved voice, alphabetically. */
export async function GET() {
  return NextResponse.json({ voices: await listBrandVoices() });
}

/** POST /api/brand-voices — create a voice. */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (body === null) {
    return jsonError("The request body must be valid JSON.", 400);
  }

  const input = body as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name) {
    return jsonError("Give the voice a name.", 400);
  }
  if (name.length > MAX_NAME_LENGTH) {
    return jsonError(`The name must be ${MAX_NAME_LENGTH} characters or fewer.`, 400);
  }
  if (
    typeof input.description === "string" &&
    input.description.length > MAX_DESCRIPTION_LENGTH
  ) {
    return jsonError(
      `The description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer.`,
      400,
    );
  }
  if (
    typeof input.instructions === "string" &&
    input.instructions.length > MAX_INSTRUCTIONS_LENGTH
  ) {
    return jsonError(
      `The instructions must be ${MAX_INSTRUCTIONS_LENGTH} characters or fewer.`,
      400,
    );
  }

  const asList = (value: unknown) =>
    typeof value === "string" || Array.isArray(value) ? (value as string | string[]) : undefined;

  const voice = await createBrandVoice({
    name,
    description: typeof input.description === "string" ? input.description : undefined,
    tone: typeof input.tone === "string" ? input.tone : undefined,
    audience: typeof input.audience === "string" ? input.audience : undefined,
    wordsToUse: asList(input.wordsToUse),
    wordsToAvoid: asList(input.wordsToAvoid),
    instructions: typeof input.instructions === "string" ? input.instructions : undefined,
  });

  return NextResponse.json({ voice }, { status: 201 });
}
