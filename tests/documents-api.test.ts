import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Exercises the document HTTP routes with real Request objects against the real
 * file-backed store, in a temporary data directory.
 */

let dataDir: string;

before(async () => {
  dataDir = await mkdtemp(path.join(tmpdir(), "nw-api-"));
  process.env.NW_DATA_DIR = dataDir;
});

after(async () => {
  delete process.env.NW_DATA_DIR;
  await rm(dataDir, { recursive: true, force: true });
});

function jsonRequest(url: string, body: unknown, method = "POST"): Request {
  return new Request(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function loadRoutes() {
  return {
    collection: await import("@/app/api/documents/route"),
    single: await import("@/app/api/documents/[id]/route"),
  };
}

describe("POST /api/documents", () => {
  it("rejects a body that is not valid JSON", async () => {
    const { collection } = await loadRoutes();
    const request = new Request("http://test/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not json",
    });
    const response = await collection.POST(request);
    assert.equal(response.status, 400);
  });

  it("rejects empty content instead of creating a blank document", async () => {
    const { collection } = await loadRoutes();
    const response = await collection.POST(
      jsonRequest("http://test/api/documents", { content: "   ", contentType: "article" }),
    );
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.match(body.error, /content/i);
  });

  it("rejects an unknown content type", async () => {
    const { collection } = await loadRoutes();
    const response = await collection.POST(
      jsonRequest("http://test/api/documents", { content: "hi", contentType: "poem" }),
    );
    assert.equal(response.status, 400);
  });

  it("creates a document and returns 201 with the stored record", async () => {
    const { collection } = await loadRoutes();
    const response = await collection.POST(
      jsonRequest("http://test/api/documents", {
        content: "First line of the piece\n\nMore body.",
        contentType: "blog_post",
      }),
    );
    assert.equal(response.status, 201);
    const body = await response.json();
    assert.equal(body.document.title, "First line of the piece");
    assert.equal(body.document.contentType, "blog_post");
    assert.ok(body.document.id);
  });
});

describe("GET /api/documents", () => {
  it("lists created documents and honours a search term", async () => {
    const { collection } = await loadRoutes();
    await collection.POST(
      jsonRequest("http://test/api/documents", {
        title: "Unique Zebra Topic",
        content: "body",
        contentType: "article",
      }),
    );

    const all = await (await collection.GET(new Request("http://test/api/documents"))).json();
    assert.ok(all.documents.length >= 1);

    const filtered = await (
      await collection.GET(new Request("http://test/api/documents?q=zebra"))
    ).json();
    assert.equal(filtered.documents.length, 1);
    assert.equal(filtered.documents[0].title, "Unique Zebra Topic");
  });

  it("ignores an invalid sort and falls back to the default", async () => {
    const { collection } = await loadRoutes();
    const response = await collection.GET(
      new Request("http://test/api/documents?sort=chaos"),
    );
    assert.equal(response.status, 200);
  });
});

describe("single document routes", () => {
  async function createOne(): Promise<string> {
    const { collection } = await loadRoutes();
    const response = await collection.POST(
      jsonRequest("http://test/api/documents", {
        title: "Lifecycle",
        content: "start",
        contentType: "article",
      }),
    );
    return (await response.json()).document.id as string;
  }

  it("returns 404 for an unknown id", async () => {
    const { single } = await loadRoutes();
    const response = await single.GET(new Request("http://test/api/documents/nope"), {
      params: Promise.resolve({ id: "nope" }),
    });
    assert.equal(response.status, 404);
  });

  it("updates content through PATCH and recomputes the word count", async () => {
    const { single } = await loadRoutes();
    const id = await createOne();
    const response = await single.PATCH(
      jsonRequest("http://test/api/documents/" + id, { content: "one two three" }, "PATCH"),
      { params: Promise.resolve({ id }) },
    );
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.document.wordCount, 3);
  });

  it("rejects a non-string title on PATCH", async () => {
    const { single } = await loadRoutes();
    const id = await createOne();
    const response = await single.PATCH(
      jsonRequest("http://test/api/documents/" + id, { title: 42 }, "PATCH"),
      { params: Promise.resolve({ id }) },
    );
    assert.equal(response.status, 400);
  });

  it("trashes by default and only deletes permanently when asked", async () => {
    const { single } = await loadRoutes();
    const id = await createOne();

    const trashed = await single.DELETE(
      new Request("http://test/api/documents/" + id, { method: "DELETE" }),
      { params: Promise.resolve({ id }) },
    );
    assert.equal(trashed.status, 200);
    const trashedBody = await trashed.json();
    assert.ok(trashedBody.document.deletedAt, "should be soft-deleted");

    const stillThere = await single.GET(
      new Request("http://test/api/documents/" + id),
      { params: Promise.resolve({ id }) },
    );
    assert.equal(stillThere.status, 200, "a trashed document is still readable");

    const permanent = await single.DELETE(
      new Request("http://test/api/documents/" + id + "?permanent=true", { method: "DELETE" }),
      { params: Promise.resolve({ id }) },
    );
    assert.equal(permanent.status, 200);

    const gone = await single.GET(
      new Request("http://test/api/documents/" + id),
      { params: Promise.resolve({ id }) },
    );
    assert.equal(gone.status, 404);
  });

  it("restores a trashed document through POST", async () => {
    const { single } = await loadRoutes();
    const id = await createOne();
    await single.DELETE(new Request("http://test/api/documents/" + id, { method: "DELETE" }), {
      params: Promise.resolve({ id }),
    });

    const restored = await single.POST(new Request("http://test/api/documents/" + id), {
      params: Promise.resolve({ id }),
    });
    assert.equal(restored.status, 200);
    assert.equal((await restored.json()).document.deletedAt, null);
  });
});

describe("PATCH /api/documents (bulk trash)", () => {
  it("requires at least one id", async () => {
    const { collection } = await loadRoutes();
    const response = await collection.PATCH(
      jsonRequest("http://test/api/documents", { ids: [] }, "PATCH"),
    );
    assert.equal(response.status, 400);
  });

  it("trashes the requested documents and ignores unknown ids", async () => {
    const { collection } = await loadRoutes();
    const created = await collection.POST(
      jsonRequest("http://test/api/documents", {
        title: "Bulk A",
        content: "body",
        contentType: "article",
      }),
    );
    const id = (await created.json()).document.id;

    const response = await collection.PATCH(
      jsonRequest("http://test/api/documents", { ids: [id, "missing-id"] }, "PATCH"),
    );
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body.trashed, [id]);
  });
});
