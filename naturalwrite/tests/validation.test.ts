import test from "node:test";
import assert from "node:assert/strict";

import { validateBrief, validateSectionRequest } from "@/lib/ai/validation";
import { parseOutline, cleanProse } from "@/lib/ai/generate";
import type { ValidatedBrief } from "@/lib/ai/validation";

const validBrief: ValidatedBrief = {
  topic: "A topic",
  contentType: "article",
  tone: "natural",
  audience: "",
  requirements: "",
  length: "medium",
  targetWords: 900,
  language: "English",
};

test("validateBrief accepts a minimal valid body and applies defaults", () => {
  const result = validateBrief({ topic: "Why sleep matters" });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.contentType, "article");
  assert.equal(result.value.tone, "natural");
  assert.equal(result.value.length, "medium");
  assert.equal(result.value.targetWords, 900);
  assert.equal(result.value.language, "English");
});

test("validateBrief rejects a missing topic with a specific message", () => {
  const result = validateBrief({});
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.ok(result.errors.some((error) => /topic is required/i.test(error)));
});

test("validateBrief rejects a whitespace-only topic", () => {
  const result = validateBrief({ topic: "   " });
  assert.equal(result.ok, false);
});

test("validateBrief rejects an over-long topic", () => {
  const result = validateBrief({ topic: "x".repeat(501) });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.ok(result.errors.some((error) => /500 characters/.test(error)));
});

test("validateBrief rejects unknown enum values rather than silently defaulting", () => {
  const result = validateBrief({ topic: "T", tone: "sarcastic", contentType: "tweet" });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.ok(result.errors.some((error) => /tone is not recognised/i.test(error)));
  assert.ok(result.errors.some((error) => /content type is not recognised/i.test(error)));
});

test("validateBrief requires a word count for a custom length", () => {
  const missing = validateBrief({ topic: "T", length: "custom" });
  assert.equal(missing.ok, false);
  if (missing.ok) return;
  assert.ok(missing.errors.some((error) => /custom length needs a word count/i.test(error)));
});

test("validateBrief enforces the custom word-count range", () => {
  const tooLow = validateBrief({ topic: "T", length: "custom", customWords: 10 });
  assert.equal(tooLow.ok, false);

  const tooHigh = validateBrief({ topic: "T", length: "custom", customWords: 9000 });
  assert.equal(tooHigh.ok, false);

  const ok = validateBrief({ topic: "T", length: "custom", customWords: 2500 });
  assert.equal(ok.ok, true);
  if (!ok.ok) return;
  assert.equal(ok.value.targetWords, 2500);
});

test("validateBrief trims and reports multiple errors at once", () => {
  const result = validateBrief({ topic: "  spaced topic  ", audience: "y".repeat(400) });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.ok(result.errors.some((error) => /audience must be/.test(error)));
});

test("validateBrief handles non-object input without throwing", () => {
  assert.equal(validateBrief(null).ok, false);
  assert.equal(validateBrief("nope").ok, false);
  assert.equal(validateBrief(undefined).ok, false);
});

test("validateSectionRequest requires a section title", () => {
  const result = validateSectionRequest({ brief: { topic: "T" } });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.ok(result.errors.some((error) => /section title is required/i.test(error)));
});

test("validateSectionRequest propagates brief errors", () => {
  const result = validateSectionRequest({ brief: {}, sectionTitle: "Intro" });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.ok(result.errors.some((error) => /topic is required/i.test(error)));
});

test("validateSectionRequest derives a word target when none is given", () => {
  const result = validateSectionRequest({
    brief: { topic: "T", length: "long" },
    sectionTitle: "Body",
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.ok(result.value.sectionWordTarget > 0);
});

test("validateSectionRequest keeps only the tail of long prior context", () => {
  const long = "x".repeat(9000);
  const result = validateSectionRequest({
    brief: { topic: "T" },
    sectionTitle: "Body",
    priorContext: long,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.ok(result.value.priorContext.length <= 6000);
});

test("parseOutline reads a well-formed response and recomputes word targets", () => {
  const response = JSON.stringify({
    title: "Shipping Faster",
    sections: [
      { title: "Introduction", summary: "Set the scene." },
      { title: "The bottleneck", summary: "Where time goes." },
      { title: "Conclusion", summary: "Wrap up." },
    ],
  });

  const outline = parseOutline(response, validBrief);
  assert.ok(outline);
  assert.equal(outline!.title, "Shipping Faster");
  assert.equal(outline!.sections.length, 3);
  assert.equal(
    outline!.sections.reduce((sum, section) => sum + section.wordTarget, 0),
    900,
    "section targets must total the brief target",
  );
});

test("parseOutline strips markdown fences and heading markers", () => {
  const response = '```json\n{"title": "## A Title", "sections": [{"title": "# Intro"}]}\n```';
  const outline = parseOutline(response, validBrief);
  assert.ok(outline);
  assert.equal(outline!.title, "A Title");
  assert.equal(outline!.sections[0].title, "Intro");
});

test("parseOutline drops sections with no usable title", () => {
  const response = JSON.stringify({
    title: "T",
    sections: [{ title: "Keep" }, { summary: "no title here" }, { title: "   " }],
  });
  const outline = parseOutline(response, validBrief);
  assert.ok(outline);
  assert.equal(outline!.sections.length, 1);
  assert.equal(outline!.sections[0].title, "Keep");
});

test("parseOutline returns null for unusable output instead of a partial outline", () => {
  assert.equal(parseOutline("I cannot help with that.", validBrief), null);
  assert.equal(parseOutline("{}", validBrief), null);
  assert.equal(parseOutline('{"sections": []}', validBrief), null);
});

test("parseOutline caps the section count so a runaway response cannot break layout", () => {
  const sections = Array.from({ length: 20 }, (_, index) => ({ title: `Section ${index}` }));
  const outline = parseOutline(JSON.stringify({ title: "T", sections }), validBrief);
  assert.ok(outline);
  assert.ok(outline!.sections.length <= 7);
});

test("cleanProse removes fence markers and a leading heading", () => {
  assert.equal(cleanProse("```markdown\n## Heading\n\nReal text."), "Real text.");
  assert.equal(cleanProse("Plain text."), "Plain text.");
  assert.equal(cleanProse("  spaced  "), "spaced");
});
