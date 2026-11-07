import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  buildBrainstormPrompt,
  buildOutlinePrompt,
  buildRewritePrompt,
  buildSectionPrompt,
} from "@/lib/ai/prompts";
import { validateBrief } from "@/lib/ai/validation";

/**
 * Brand voice is only real if it reaches the prompt. These tests check the route
 * payload end to end and confirm the rendered guidance lands in the system
 * message the model actually receives.
 */

let dataDir: string;

before(async () => {
  dataDir = await mkdtemp(path.join(tmpdir(), "nw-voice-api-"));
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
    collection: await import("@/app/api/brand-voices/route"),
    single: await import("@/app/api/brand-voices/[id]/route"),
    resolve: await import("@/lib/brand-voice/store"),
  };
}

describe("brand voice API", () => {
  it("rejects a voice with no name", async () => {
    const { collection } = await loadRoutes();
    const response = await collection.POST(
      jsonRequest("http://test/api/brand-voices", { tone: "Warm" }),
    );
    assert.equal(response.status, 400);
  });

  it("creates a voice and returns it with an id", async () => {
    const { collection } = await loadRoutes();
    const response = await collection.POST(
      jsonRequest("http://test/api/brand-voices", {
        name: "API voice",
        tone: "Direct",
        wordsToAvoid: "leverage, synergy",
      }),
    );
    assert.equal(response.status, 201);
    const body = await response.json();
    assert.ok(body.voice.id);
    assert.deepEqual(body.voice.wordsToAvoid, ["leverage", "synergy"]);
  });

  it("lists voices and updates one by id", async () => {
    const { collection, single } = await loadRoutes();
    const created = await collection.POST(
      jsonRequest("http://test/api/brand-voices", { name: "Editable voice" }),
    );
    const id = (await created.json()).voice.id;

    const patched = await single.PATCH(
      jsonRequest(`http://test/api/brand-voices/${id}`, { tone: "Playful" }, "PATCH"),
      { params: Promise.resolve({ id }) },
    );
    assert.equal(patched.status, 200);
    assert.equal((await patched.json()).voice.tone, "Playful");

    const list = await (await collection.GET()).json();
    assert.ok(list.voices.some((voice: { id: string }) => voice.id === id));
  });

  it("returns 404 for an unknown voice and after deletion", async () => {
    const { single } = await loadRoutes();
    const missing = await single.GET(
      new Request("http://test/api/brand-voices/nope"),
      { params: Promise.resolve({ id: "nope" }) },
    );
    assert.equal(missing.status, 404);
  });
});

describe("resolveBrandVoiceText", () => {
  it("returns the rendered guidance for a saved voice", async () => {
    const { collection, resolve } = await loadRoutes();
    const created = await collection.POST(
      jsonRequest("http://test/api/brand-voices", {
        name: "Resolver",
        tone: "Measured",
        wordsToAvoid: "delve",
      }),
    );
    const id = (await created.json()).voice.id;

    const text = await resolve.resolveBrandVoiceText(id);
    assert.match(text, /Tone: Measured\./);
    assert.match(text, /Never use these words: delve\./);
  });

  it("returns an empty string for a missing id rather than throwing", async () => {
    const { resolve } = await loadRoutes();
    assert.equal(await resolve.resolveBrandVoiceText("does-not-exist"), "");
    assert.equal(await resolve.resolveBrandVoiceText(undefined), "");
  });
});

describe("brand voice reaches the prompt", () => {
  const voice = "Tone: Direct.\nNever use these words: leverage.";

  it("includes the voice in the section system prompt", () => {
    const { system } = buildSectionPrompt(
      {
        topic: "A topic",
        contentType: "article",
        tone: "natural",
        audience: "",
        targetWords: 900,
        brandVoice: voice,
      },
      { title: "Intro" },
      200,
    );
    assert.match(system, /Brand voice to follow/);
    assert.match(system, /Never use these words: leverage\./);
  });

  it("omits the voice block entirely when no voice is set", () => {
    const { system } = buildSectionPrompt(
      {
        topic: "A topic",
        contentType: "article",
        tone: "natural",
        audience: "",
        targetWords: 900,
      },
      { title: "Intro" },
      200,
    );
    assert.doesNotMatch(system, /Brand voice to follow/);
  });

  it("includes the voice in the outline system prompt", () => {
    const { system } = buildOutlinePrompt({
      topic: "A topic",
      contentType: "blog_post",
      tone: "natural",
      audience: "",
      targetWords: 900,
      brandVoice: voice,
    });
    assert.match(system, /Brand voice to follow/);
    assert.match(system, /Tone: Direct\./);
  });

  it("omits the outline voice block when no voice is set", () => {
    const { system } = buildOutlinePrompt({
      topic: "A topic",
      contentType: "blog_post",
      tone: "natural",
      audience: "",
      targetWords: 900,
    });
    assert.doesNotMatch(system, /Brand voice to follow/);
  });

  it("includes the voice in the rewrite system prompt", () => {
    const { system } = buildRewritePrompt("some text", "improve", { brandVoice: voice });
    assert.match(system, /Never use these words: leverage\./);
  });

  it("includes the voice in the brainstorm system prompt", () => {
    const { system } = buildBrainstormPrompt("a subject", "topics", 5, voice);
    assert.match(system, /Tone: Direct\./);
  });
});

describe("validateBrief brand voice field", () => {
  it("passes a normal id through", () => {
    const result = validateBrief({ topic: "A topic", brandVoiceId: "abc-123" });
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.value.brandVoiceId, "abc-123");
  });

  it("omits the field when it is blank", () => {
    const result = validateBrief({ topic: "A topic", brandVoiceId: "  " });
    assert.equal(result.ok, true);
    if (result.ok) assert.equal(result.value.brandVoiceId, undefined);
  });

  it("rejects an absurdly long reference", () => {
    const result = validateBrief({ topic: "A topic", brandVoiceId: "x".repeat(200) });
    assert.equal(result.ok, false);
  });
});
