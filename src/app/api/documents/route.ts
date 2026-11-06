import { NextResponse } from "next/server";
import {
  createDocument,
  listAllDocuments,
  moveDocumentToTrash,
} from "@/lib/documents/store";
import {
  DOCUMENT_SORTS,
  isDocumentSort,
  isDocumentStatus,
  queryDocuments,
} from "@/lib/documents/query";
import { isContentType } from "@/lib/ai/options";
import { jsonError, readJson } from "@/lib/ai/route-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/documents — the library, filtered and sorted by query string. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const sortParam = url.searchParams.get("sort");
  const sort = isDocumentSort(sortParam)
    ? sortParam
    : DOCUMENT_SORTS[0].id;

  const contentTypeParam = url.searchParams.get("type");
  const statusParam = url.searchParams.get("status");

  const documents = queryDocuments(await listAllDocuments(), {
    search: url.searchParams.get("q") ?? undefined,
    sort,
    favoritesOnly: url.searchParams.get("favorites") === "true",
    contentType:
      contentTypeParam && isContentType(contentTypeParam) ? contentTypeParam : "all",
    status: statusParam && isDocumentStatus(statusParam) ? statusParam : "all",
  });

  return NextResponse.json({ documents });
}

/** POST /api/documents — create a document from the editor or the studio. */
export async function POST(request: Request) {
  const body = await readJson(request);
  if (body === null) {
    return jsonError("The request body must be valid JSON.", 400);
  }

  const input = body as Record<string, unknown>;
  const content = typeof input.content === "string" ? input.content : "";
  if (!content.trim()) {
    return jsonError("A document needs some content before it can be saved.", 400);
  }
  if (!isContentType(input.contentType)) {
    return jsonError("Choose a valid document type.", 400);
  }
  if (input.title !== undefined && typeof input.title !== "string") {
    return jsonError("The title must be text.", 400);
  }
  if (input.status !== undefined && !isDocumentStatus(input.status)) {
    return jsonError("Choose a valid document status.", 400);
  }

  const document = await createDocument({
    title: typeof input.title === "string" ? input.title : undefined,
    content,
    contentType: input.contentType,
    status: isDocumentStatus(input.status) ? input.status : undefined,
    isFavorite: input.isFavorite === true,
  });

  return NextResponse.json({ document }, { status: 201 });
}

/** DELETE /api/documents — empty the trash, returning how many were removed. */
export async function DELETE() {
  const { emptyTrash } = await import("@/lib/documents/store");
  const removed = await emptyTrash();
  return NextResponse.json({ removed });
}

/** PATCH /api/documents — bulk trash by id list. */
export async function PATCH(request: Request) {
  const body = await readJson(request);
  if (body === null) {
    return jsonError("The request body must be valid JSON.", 400);
  }

  const input = body as Record<string, unknown>;
  const ids = Array.isArray(input.ids)
    ? input.ids.filter((id): id is string => typeof id === "string")
    : [];
  if (ids.length === 0) {
    return jsonError("Select at least one document.", 400);
  }

  const trashed: string[] = [];
  for (const id of ids) {
    const result = await moveDocumentToTrash(id);
    if (result) trashed.push(result.id);
  }

  return NextResponse.json({ trashed });
}
