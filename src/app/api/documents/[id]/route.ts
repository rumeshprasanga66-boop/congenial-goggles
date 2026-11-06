import { NextResponse } from "next/server";
import {
  deleteDocumentPermanently,
  getDocument,
  moveDocumentToTrash,
  restoreDocument,
  updateDocument,
} from "@/lib/documents/store";
import { isDocumentStatus } from "@/lib/documents/query";
import { isContentType } from "@/lib/ai/options";
import { jsonError, readJson } from "@/lib/ai/route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** GET /api/documents/:id — one document, or 404. */
export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const document = await getDocument(id);
  if (!document) return jsonError("That document does not exist.", 404);
  return NextResponse.json({ document });
}

/** PATCH /api/documents/:id — update content, title, type, status or favourite. */
export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await readJson(request);
  if (body === null) {
    return jsonError("The request body must be valid JSON.", 400);
  }

  const input = body as Record<string, unknown>;
  if (input.title !== undefined && typeof input.title !== "string") {
    return jsonError("The title must be text.", 400);
  }
  if (input.content !== undefined && typeof input.content !== "string") {
    return jsonError("The content must be text.", 400);
  }
  if (input.contentType !== undefined && !isContentType(input.contentType)) {
    return jsonError("Choose a valid document type.", 400);
  }
  if (input.status !== undefined && !isDocumentStatus(input.status)) {
    return jsonError("Choose a valid document status.", 400);
  }
  if (input.isFavorite !== undefined && typeof input.isFavorite !== "boolean") {
    return jsonError("The favourite flag must be true or false.", 400);
  }

  const document = await updateDocument(id, {
    title: typeof input.title === "string" ? input.title : undefined,
    content: typeof input.content === "string" ? input.content : undefined,
    contentType: isContentType(input.contentType) ? input.contentType : undefined,
    status: isDocumentStatus(input.status) ? input.status : undefined,
    isFavorite: typeof input.isFavorite === "boolean" ? input.isFavorite : undefined,
  });

  if (!document) return jsonError("That document does not exist.", 404);
  return NextResponse.json({ document });
}

/** POST /api/documents/:id — restore from trash. */
export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const document = await restoreDocument(id);
  if (!document) return jsonError("That document does not exist.", 404);
  return NextResponse.json({ document });
}

/** DELETE /api/documents/:id — trash by default, permanent with ?permanent=true. */
export async function DELETE(request: Request, { params }: Params) {
  const { id } = await params;
  const permanent = new URL(request.url).searchParams.get("permanent") === "true";

  if (permanent) {
    const removed = await deleteDocumentPermanently(id);
    if (!removed) return jsonError("That document does not exist.", 404);
    return NextResponse.json({ deleted: true });
  }

  const document = await moveDocumentToTrash(id);
  if (!document) return jsonError("That document does not exist.", 404);
  return NextResponse.json({ document });
}
