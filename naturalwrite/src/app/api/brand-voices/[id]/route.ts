import { NextResponse } from "next/server";
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_INSTRUCTIONS_LENGTH,
  MAX_NAME_LENGTH,
  deleteBrandVoice,
  getBrandVoice,
  updateBrandVoice,
} from "@/lib/brand-voice/store";
import { jsonError, readJson } from "@/lib/ai/route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const voice = await getBrandVoice(id);
  if (!voice) return jsonError("That brand voice does not exist.", 404);
  return NextResponse.json({ voice });
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await readJson(request);
  if (body === null) {
    return jsonError("The request body must be valid JSON.", 400);
  }

  const input = body as Record<string, unknown>;
  if (input.name !== undefined && (typeof input.name !== "string" || !input.name.trim())) {
    return jsonError("Give the voice a name.", 400);
  }
  if (typeof input.name === "string" && input.name.length > MAX_NAME_LENGTH) {
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

  const voice = await updateBrandVoice(id, {
    name: typeof input.name === "string" ? input.name : undefined,
    description: typeof input.description === "string" ? input.description : undefined,
    tone: typeof input.tone === "string" ? input.tone : undefined,
    audience: typeof input.audience === "string" ? input.audience : undefined,
    wordsToUse: asList(input.wordsToUse),
    wordsToAvoid: asList(input.wordsToAvoid),
    instructions: typeof input.instructions === "string" ? input.instructions : undefined,
  });

  if (!voice) return jsonError("That brand voice does not exist.", 404);
  return NextResponse.json({ voice });
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const removed = await deleteBrandVoice(id);
  if (!removed) return jsonError("That brand voice does not exist.", 404);
  return NextResponse.json({ deleted: true });
}
