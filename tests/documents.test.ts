import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  daysUntilPurge,
  deriveTitle,
  documentStats,
  favouriteDocuments,
  normaliseTitle,
  queryDocuments,
  sortDocuments,
  trashedDocuments,
  TRASH_RETENTION_DAYS,
} from "@/lib/documents/query";
import type { DocumentRecord } from "@/lib/types";

function doc(overrides: Partial<DocumentRecord> = {}): DocumentRecord {
  return {
    id: "id",
    title: "Title",
    content: "Body text",
    contentType: "article",
    wordCount: 2,
    isFavorite: false,
    status: "draft",
    deletedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("deriveTitle", () => {
  it("uses the first non-empty line", () => {
    assert.equal(deriveTitle("\n\n  A real opening line\nSecond line"), "A real opening line");
  });

  it("strips a leading markdown heading marker", () => {
    assert.equal(deriveTitle("## Why loops matter\n\nBody"), "Why loops matter");
  });

  it("falls back to a neutral label rather than inventing a topic", () => {
    assert.equal(deriveTitle("   \n  "), "Untitled document");
  });

  it("truncates a very long first line instead of storing all of it", () => {
    const long = "word ".repeat(60).trim();
    const title = deriveTitle(long);
    assert.ok(title.length <= 70, `expected <= 70 chars, got ${title.length}`);
    assert.ok(title.endsWith("…"));
  });
});

describe("normaliseTitle", () => {
  it("prefers an explicit title over the derived one", () => {
    assert.equal(normaliseTitle("My title", "some body"), "My title");
  });

  it("derives when the explicit title is only whitespace", () => {
    assert.equal(normaliseTitle("   ", "Body line"), "Body line");
  });

  it("caps the stored title length", () => {
    const title = normaliseTitle("x".repeat(500), "body");
    assert.equal(title.length, 200);
  });
});

describe("queryDocuments", () => {
  const documents = [
    doc({ id: "a", title: "Alpha", content: "apples", updatedAt: "2026-01-03T00:00:00.000Z", wordCount: 300 }),
    doc({ id: "b", title: "Beta", content: "bananas", updatedAt: "2026-01-05T00:00:00.000Z", wordCount: 100, isFavorite: true }),
    doc({ id: "c", title: "Gamma", content: "cherries", updatedAt: "2026-01-01T00:00:00.000Z", wordCount: 200, contentType: "email" }),
    doc({ id: "d", title: "Deleted", content: "gone", deletedAt: "2026-01-02T00:00:00.000Z" }),
  ];

  it("excludes trashed documents by default", () => {
    const ids = queryDocuments(documents).map((entry) => entry.id);
    assert.deepEqual(ids, ["b", "a", "c"]);
  });

  it("searches both the title and the body case-insensitively", () => {
    assert.deepEqual(queryDocuments(documents, { search: "BANAN" }).map((d) => d.id), ["b"]);
    assert.deepEqual(queryDocuments(documents, { search: "cherries" }).map((d) => d.id), ["c"]);
  });

  it("filters by content type", () => {
    assert.deepEqual(
      queryDocuments(documents, { contentType: "email" }).map((d) => d.id),
      ["c"],
    );
  });

  it("treats 'all' as no filter", () => {
    assert.equal(queryDocuments(documents, { contentType: "all" }).length, 3);
  });

  it("returns only favourites when asked", () => {
    assert.deepEqual(queryDocuments(documents, { favoritesOnly: true }).map((d) => d.id), ["b"]);
  });

  it("returns nothing for a search with no match rather than everything", () => {
    assert.deepEqual(queryDocuments(documents, { search: "zzz" }), []);
  });
});

describe("sortDocuments", () => {
  const documents = [
    doc({ id: "a", title: "Beta", wordCount: 100, updatedAt: "2026-01-01T00:00:00.000Z", createdAt: "2026-02-01T00:00:00.000Z" }),
    doc({ id: "b", title: "alpha", wordCount: 300, updatedAt: "2026-01-03T00:00:00.000Z", createdAt: "2026-01-01T00:00:00.000Z" }),
  ];

  it("sorts by most recently updated by default", () => {
    assert.deepEqual(sortDocuments(documents, "updated_desc").map((d) => d.id), ["b", "a"]);
  });

  it("sorts oldest updated first", () => {
    assert.deepEqual(sortDocuments(documents, "updated_asc").map((d) => d.id), ["a", "b"]);
  });

  it("sorts titles case-insensitively", () => {
    assert.deepEqual(sortDocuments(documents, "title_asc").map((d) => d.id), ["b", "a"]);
  });

  it("sorts by word count descending", () => {
    assert.deepEqual(sortDocuments(documents, "words_desc").map((d) => d.id), ["b", "a"]);
  });

  it("does not mutate the input array", () => {
    const input = [...documents];
    sortDocuments(input, "title_asc");
    assert.deepEqual(input.map((d) => d.id), ["a", "b"]);
  });
});

describe("trashedDocuments and favouriteDocuments", () => {
  const documents = [
    doc({ id: "live", isFavorite: true }),
    doc({ id: "old", deletedAt: "2026-01-01T00:00:00.000Z" }),
    doc({ id: "recent", deletedAt: "2026-03-01T00:00:00.000Z" }),
  ];

  it("lists trashed documents newest deletion first", () => {
    assert.deepEqual(trashedDocuments(documents).map((d) => d.id), ["recent", "old"]);
  });

  it("excludes trashed documents from favourites", () => {
    const withTrashedFavourite = [
      ...documents,
      doc({ id: "gone", isFavorite: true, deletedAt: "2026-03-02T00:00:00.000Z" }),
    ];
    assert.deepEqual(favouriteDocuments(withTrashedFavourite).map((d) => d.id), ["live"]);
  });
});

describe("documentStats", () => {
  it("counts live and trashed documents separately and sums words over live ones only", () => {
    const stats = documentStats([
      doc({ id: "a", wordCount: 100, isFavorite: true }),
      doc({ id: "b", wordCount: 50 }),
      doc({ id: "c", wordCount: 999, deletedAt: "2026-01-01T00:00:00.000Z" }),
    ]);
    assert.deepEqual(stats, { total: 2, words: 150, favorites: 1, trashed: 1 });
  });

  it("returns zeroes for an empty library", () => {
    assert.deepEqual(documentStats([]), { total: 0, words: 0, favorites: 0, trashed: 0 });
  });
});

describe("daysUntilPurge", () => {
  const now = Date.parse("2026-03-10T00:00:00.000Z");

  it("counts down from the retention window", () => {
    const deleted = new Date(now - 10 * 86_400_000).toISOString();
    assert.equal(daysUntilPurge(deleted, now), TRASH_RETENTION_DAYS - 10);
  });

  it("never returns a negative number once the window has passed", () => {
    const deleted = new Date(now - 90 * 86_400_000).toISOString();
    assert.equal(daysUntilPurge(deleted, now), 0);
  });

  it("treats an unparseable date as a full window rather than an immediate purge", () => {
    assert.equal(daysUntilPurge("not-a-date", now), TRASH_RETENTION_DAYS);
  });
});
