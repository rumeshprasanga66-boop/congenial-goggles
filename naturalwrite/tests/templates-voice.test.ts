import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  BUILTIN_TEMPLATES,
  TEMPLATE_CATEGORIES,
  getBuiltinTemplate,
  templatesInCategory,
} from "@/lib/templates/builtin";
import { renderBrandVoice, brandVoiceIsEmpty } from "@/lib/brand-voice/render";
import { CONTENT_TYPES, TONES, LENGTHS } from "@/lib/ai/options";

let dataDir: string;

before(async () => {
  dataDir = await mkdtemp(path.join(tmpdir(), "nw-voice-"));
  process.env.NW_DATA_DIR = dataDir;
});

after(async () => {
  delete process.env.NW_DATA_DIR;
  await rm(dataDir, { recursive: true, force: true });
});

describe("built-in templates", () => {
  it("gives every template a unique id", () => {
    const ids = BUILTIN_TEMPLATES.map((template) => template.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("only references content types, tones and lengths that actually exist", () => {
    const typeIds = new Set(CONTENT_TYPES.map((type) => type.id));
    const toneIds = new Set(TONES.map((tone) => tone.id));
    const lengthIds = new Set(LENGTHS.map((length) => length.id));

    for (const template of BUILTIN_TEMPLATES) {
      assert.ok(typeIds.has(template.contentType), `${template.id} has a bad content type`);
      assert.ok(toneIds.has(template.tone), `${template.id} has a bad tone`);
      assert.ok(lengthIds.has(template.length), `${template.id} has a bad length`);
    }
  });

  it("gives every template a description and guidance that are not empty", () => {
    for (const template of BUILTIN_TEMPLATES) {
      assert.ok(template.title.trim().length > 0, `${template.id} needs a title`);
      assert.ok(template.description.trim().length > 0, `${template.id} needs a description`);
      assert.ok(template.guidance.trim().length > 0, `${template.id} needs guidance`);
      assert.ok(template.topicPrompt.trim().length > 0, `${template.id} needs a topic prompt`);
    }
  });

  it("derives categories from the templates so no category is empty", () => {
    for (const category of TEMPLATE_CATEGORIES) {
      assert.ok(templatesInCategory(category).length > 0, `${category} has no templates`);
    }
    assert.equal(
      TEMPLATE_CATEGORIES.length,
      new Set(BUILTIN_TEMPLATES.map((template) => template.category)).size,
    );
  });

  it("looks up a template by id and returns null for an unknown one", () => {
    assert.equal(getBuiltinTemplate("how-to-guide")?.title, "How-to guide");
    assert.equal(getBuiltinTemplate("no-such-template"), null);
  });
});

describe("renderBrandVoice", () => {
  const base = {
    name: "House",
    description: "",
    tone: "",
    audience: "",
    wordsToUse: [],
    wordsToAvoid: [],
    instructions: "",
  };

  it("returns an empty string when the voice carries no guidance", () => {
    assert.equal(renderBrandVoice(base), "");
    assert.equal(brandVoiceIsEmpty(base), true);
  });

  it("includes each part that is set", () => {
    const rendered = renderBrandVoice({
      ...base,
      description: "Warm and precise.",
      tone: "Friendly",
      audience: "Product managers",
      wordsToUse: ["ship", "loop"],
      wordsToAvoid: ["leverage"],
      instructions: "Never use exclamation marks.",
    });

    assert.match(rendered, /Warm and precise\./);
    assert.match(rendered, /Tone: Friendly\./);
    assert.match(rendered, /Written for: Product managers\./);
    assert.match(rendered, /ship, loop/);
    assert.match(rendered, /Never use these words: leverage\./);
    assert.match(rendered, /Never use exclamation marks\./);
    assert.equal(brandVoiceIsEmpty({ ...base, tone: "Friendly" }), false);
  });

  it("omits lists that are empty rather than emitting an empty instruction", () => {
    const rendered = renderBrandVoice({ ...base, tone: "Direct" });
    assert.doesNotMatch(rendered, /Prefer these words/);
    assert.doesNotMatch(rendered, /Never use these words/);
  });
});

describe("brand voice store", () => {
  async function loadStore() {
    return import("@/lib/brand-voice/store");
  }

  it("creates a voice and trims its fields", async () => {
    const store = await loadStore();
    const voice = await store.createBrandVoice({
      name: "  Editorial  ",
      tone: "  Authoritative ",
      wordsToAvoid: "delve, tapestry, delve",
    });
    assert.equal(voice.name, "Editorial");
    assert.equal(voice.tone, "Authoritative");
    assert.deepEqual(voice.wordsToAvoid, ["delve", "tapestry"], "duplicates should collapse");
  });

  it("parses a comma or newline separated word list", async () => {
    const store = await loadStore();
    assert.deepEqual(store.parseWordList("ship, loop\nbatch"), ["ship", "loop", "batch"]);
    assert.deepEqual(store.parseWordList(""), []);
    assert.deepEqual(store.parseWordList(undefined), []);
  });

  it("caps a very long word list instead of storing it unbounded", async () => {
    const store = await loadStore();
    const many = Array.from({ length: 100 }, (_, index) => `word${index}`).join(",");
    assert.equal(store.parseWordList(many).length, store.MAX_WORDS_PER_LIST);
  });

  it("updates only the fields provided", async () => {
    const store = await loadStore();
    const created = await store.createBrandVoice({ name: "First", tone: "Warm" });
    const updated = await store.updateBrandVoice(created.id, { tone: "Direct" });
    assert.equal(updated?.tone, "Direct");
    assert.equal(updated?.name, "First", "an untouched field must survive");
  });

  it("returns null when updating a voice that does not exist", async () => {
    const store = await loadStore();
    assert.equal(await store.updateBrandVoice("missing", { tone: "x" }), null);
  });

  it("lists voices alphabetically and deletes one", async () => {
    const store = await loadStore();
    const zebra = await store.createBrandVoice({ name: "Zebra" });
    await store.createBrandVoice({ name: "Aardvark" });

    const names = (await store.listBrandVoices()).map((voice) => voice.name);
    assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b)));

    assert.equal(await store.deleteBrandVoice(zebra.id), true);
    assert.equal(await store.getBrandVoice(zebra.id), null);
    assert.equal(await store.deleteBrandVoice(zebra.id), false);
  });
});
