import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * The store is exercised against a real temporary directory, not a mocked
 * filesystem, so the atomic write and JSON round-trip are genuinely covered.
 */

let dataDir: string;

before(async () => {
  dataDir = await mkdtemp(path.join(tmpdir(), "nw-store-"));
  process.env.NW_DATA_DIR = dataDir;
});

after(async () => {
  delete process.env.NW_DATA_DIR;
  await rm(dataDir, { recursive: true, force: true });
});

async function loadStore() {
  // Imported after NW_DATA_DIR is set so the module reads the temp path.
  return import("@/lib/documents/store");
}

describe("document store", () => {
  it("starts empty when no store file exists", async () => {
    const store = await loadStore();
    assert.deepEqual(await store.listAllDocuments(), []);
  });

  it("creates a document and derives its title and word count", async () => {
    const store = await loadStore();
    const created = await store.createDocument({
      content: "# Shipping faster\n\nSmall loops beat big launches.",
      contentType: "article",
    });

    assert.equal(created.title, "Shipping faster");
    assert.equal(created.status, "draft");
    assert.equal(created.deletedAt, null);
    assert.ok(created.wordCount > 0);
    assert.match(created.id, /^[0-9a-f-]{36}$/);
  });

  it("persists to disk so a fresh read sees the document", async () => {
    const store = await loadStore();
    const raw = await readFile(path.join(dataDir, "documents.json"), "utf8");
    const parsed = JSON.parse(raw);
    assert.equal(parsed.version, 1);
    assert.ok(parsed.documents.length >= 1);
  });

  it("updates content and recomputes the word count", async () => {
    const store = await loadStore();
    const created = await store.createDocument({
      title: "Editable",
      content: "one",
      contentType: "article",
    });

    const updated = await store.updateDocument(created.id, {
      content: "one two three four",
    });
    assert.equal(updated?.wordCount, 4);
    assert.equal(updated?.title, "Editable", "an explicit title should survive a body edit");
  });

  it("returns null when updating a document that does not exist", async () => {
    const store = await loadStore();
    assert.equal(await store.updateDocument("missing", { content: "x" }), null);
  });

  it("moves a document to trash and restores it", async () => {
    const store = await loadStore();
    const created = await store.createDocument({ content: "trash me", contentType: "article" });

    const trashed = await store.moveDocumentToTrash(created.id);
    assert.ok(trashed?.deletedAt, "deletedAt should be set");

    const restored = await store.restoreDocument(created.id);
    assert.equal(restored?.deletedAt, null);
  });

  it("deletes permanently and reports whether anything was removed", async () => {
    const store = await loadStore();
    const created = await store.createDocument({ content: "remove me", contentType: "article" });

    assert.equal(await store.deleteDocumentPermanently(created.id), true);
    assert.equal(await store.getDocument(created.id), null);
    assert.equal(await store.deleteDocumentPermanently(created.id), false);
  });

  it("emptyTrash removes only trashed documents", async () => {
    const store = await loadStore();
    const keep = await store.createDocument({ title: "Keep", content: "live", contentType: "article" });
    const drop = await store.createDocument({ title: "Drop", content: "dead", contentType: "article" });
    await store.moveDocumentToTrash(drop.id);

    const removed = await store.emptyTrash();
    assert.ok(removed >= 1);
    assert.ok(await store.getDocument(keep.id), "the live document must survive");
    assert.equal(await store.getDocument(drop.id), null);
  });

  it("serialises concurrent writes without losing any document", async () => {
    const store = await loadStore();
    const before = (await store.listAllDocuments()).length;

    await Promise.all(
      Array.from({ length: 12 }, (_, index) =>
        store.createDocument({ title: `Concurrent ${index}`, content: `body ${index}`, contentType: "article" }),
      ),
    );

    const after = await store.listAllDocuments();
    assert.equal(after.length, before + 12, "every concurrent create should be persisted");
  });
});
