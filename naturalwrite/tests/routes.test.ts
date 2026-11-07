import test from "node:test";
import assert from "node:assert/strict";

import { POST as outlineRoute } from "@/app/api/generate/outline/route";
import { POST as sectionRoute } from "@/app/api/generate/section/route";
import { POST as rewriteRoute } from "@/app/api/generate/rewrite/route";
import { POST as brainstormRoute } from "@/app/api/generate/brainstorm/route";

/**
 * Route-level tests exercise the real handlers with real Request objects.
 * No provider key is set, so every call must stop at the configuration guard:
 * that is the honest behaviour we want to guarantee for a deployment without
 * credentials. Validation cases that run before the guard are covered by the
 * pure validation tests.
 */

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("generation routes report that AI is unconfigured instead of failing oddly", async () => {
  const previous = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  const routes: Array<[string, (request: Request) => Promise<Response>, string]> = [
    ["outline", outlineRoute, "http://test/api/generate/outline"],
    ["section", sectionRoute, "http://test/api/generate/section"],
    ["rewrite", rewriteRoute, "http://test/api/generate/rewrite"],
    ["brainstorm", brainstormRoute, "http://test/api/generate/brainstorm"],
  ];

  for (const [name, handler, url] of routes) {
    const response = await handler(jsonRequest(url, { topic: "Anything" }));
    assert.equal(response.status, 503, `${name} should report 503 when unconfigured`);
    const payload = (await response.json()) as { error: string };
    assert.match(
      payload.error,
      /OPENAI_API_KEY/,
      `${name} should name the missing configuration`,
    );
  }

  if (previous !== undefined) process.env.OPENAI_API_KEY = previous;
});

test("routes reject a malformed JSON body with 400", async () => {
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-key-not-used";

  const request = new Request("http://test/api/generate/outline", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{ this is not json",
  });
  const response = await outlineRoute(request);
  assert.equal(response.status, 400);
  const payload = (await response.json()) as { error: string };
  assert.match(payload.error, /valid JSON/);

  if (previous === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = previous;
});

test("routes reject an empty brief with field-level details", async () => {
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-key-not-used";

  const response = await outlineRoute(jsonRequest("http://test/api/generate/outline", {}));
  assert.equal(response.status, 400);
  const payload = (await response.json()) as { error: string; details?: string[] };
  assert.ok(Array.isArray(payload.details));
  assert.ok(payload.details!.some((detail) => /topic is required/i.test(detail)));

  if (previous === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = previous;
});

test("rewrite route rejects empty text before contacting a provider", async () => {
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-key-not-used";

  const response = await rewriteRoute(
    jsonRequest("http://test/api/generate/rewrite", { text: "  ", action: "simplify" }),
  );
  assert.equal(response.status, 400);
  const payload = (await response.json()) as { error: string };
  assert.match(payload.error, /Paste some text/);

  if (previous === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = previous;
});

test("rewrite route rejects an unknown action", async () => {
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-key-not-used";

  const response = await rewriteRoute(
    jsonRequest("http://test/api/generate/rewrite", {
      text: "Some real text to work with.",
      action: "makeItViral",
    }),
  );
  assert.equal(response.status, 400);
  const payload = (await response.json()) as { error: string };
  assert.match(payload.error, /rewrite action/);

  if (previous === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = previous;
});

test("brainstorm route rejects a missing subject", async () => {
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-key-not-used";

  const response = await brainstormRoute(
    jsonRequest("http://test/api/generate/brainstorm", { subject: "", kind: "topics" }),
  );
  assert.equal(response.status, 400);

  if (previous === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = previous;
});
