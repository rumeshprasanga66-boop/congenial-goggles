import test from "node:test";
import assert from "node:assert/strict";

import {
  buildOutlinePrompt,
  buildSectionPrompt,
  buildDraftPrompt,
  buildRewritePrompt,
  buildBrainstormPrompt,
  allocateWords,
  lengthIdToWords,
  HOUSE_STYLE,
  isRewriteAction,
  isBrainstormKind,
  REWRITE_ACTIONS,
} from "@/lib/ai/prompts";
import type { WritingBrief } from "@/lib/ai/prompts";

const brief: WritingBrief = {
  topic: "How small teams ship software faster",
  contentType: "blog_post",
  tone: "conversational",
  audience: "engineering managers",
  requirements: "Mention code review and CI",
  targetWords: 900,
  language: "English",
};

test("outline prompt includes every part of the brief", () => {
  const { system, user } = buildOutlinePrompt(brief);

  assert.match(user, /How small teams ship software faster/);
  assert.match(user, /Blog post/);
  assert.match(user, /Conversational/);
  assert.match(user, /engineering managers/);
  assert.match(user, /900 words/);
  assert.match(user, /English/);
  assert.match(user, /Mention code review and CI/);
  assert.match(system, /JSON/);
});

test("outline prompt states the JSON shape it expects", () => {
  const { user } = buildOutlinePrompt(brief);
  assert.match(user, /"title": string/);
  assert.match(user, /"sections"/);
});

test("house style bans fabricated facts", () => {
  assert.match(HOUSE_STYLE, /Never invent statistics/);
  assert.match(HOUSE_STYLE, /delve/);
});

test("section prompt carries the section title, summary and word target", () => {
  const { user } = buildSectionPrompt(
    brief,
    { title: "Why feedback loops matter", summary: "Explain the core idea." },
    300,
  );

  assert.match(user, /Why feedback loops matter/);
  assert.match(user, /Explain the core idea/);
  assert.match(user, /about 300 words/);
});

test("section prompt includes prior text for continuity when supplied", () => {
  const { user } = buildSectionPrompt(
    brief,
    { title: "Conclusion", summary: "", priorContext: "Earlier we covered deploys." },
    120,
  );
  assert.match(user, /Earlier we covered deploys/);
  assert.match(user, /do not repeat it/i);
});

test("section prompt omits the continuity block when there is no prior text", () => {
  const { user } = buildSectionPrompt(brief, { title: "Intro" }, 200);
  assert.doesNotMatch(user, /already written/i);
});

test("brand voice is injected into the system prompt only when present", () => {
  const withoutVoice = buildDraftPrompt(brief);
  assert.doesNotMatch(withoutVoice.system, /Brand voice to follow/);

  const withVoice = buildDraftPrompt({ ...brief, brandVoice: "Plain and concrete." });
  assert.match(withVoice.system, /Brand voice to follow/);
  assert.match(withVoice.system, /Plain and concrete/);
});

test("rewrite prompt passes the original text through unchanged", () => {
  const original = "We utilise synergistic methodologies to leverage outcomes.";
  const { user } = buildRewritePrompt(original, "simplify");
  assert.match(user, /We utilise synergistic methodologies to leverage outcomes\./);
  assert.match(user, new RegExp(REWRITE_ACTIONS.simplify.slice(0, 30)));
});

test("rewrite prompt adds a tone line only for the tone action", () => {
  const tonePrompt = buildRewritePrompt("Some text.", "tone", { tone: "direct" });
  assert.match(tonePrompt.user, /Target tone: Direct/);

  const grammarPrompt = buildRewritePrompt("Some text.", "grammar");
  assert.doesNotMatch(grammarPrompt.user, /Target tone/);
});

test("rewrite prompt refuses to add new facts", () => {
  const { system } = buildRewritePrompt("Some text.", "expand");
  assert.match(system, /Never add facts/);
});

test("rewrite action guard accepts known actions and rejects others", () => {
  assert.equal(isRewriteAction("improve"), true);
  assert.equal(isRewriteAction("tone"), true);
  assert.equal(isRewriteAction("makeItViral"), false);
  assert.equal(isRewriteAction(undefined), false);
  assert.equal(isRewriteAction(42), false);
});

test("brainstorm guard accepts known kinds and rejects others", () => {
  assert.equal(isBrainstormKind("headlines"), true);
  assert.equal(isBrainstormKind("novel"), false);
});

test("brainstorm prompt reflects the requested count and kind", () => {
  const { user } = buildBrainstormPrompt("remote onboarding", "outline", 6);
  assert.match(user, /remote onboarding/);
  assert.match(user, /A content outline/);
  assert.match(user, /How many: 6/);
});

test("allocateWords totals exactly the requested word count", () => {
  const sections = [
    { title: "Introduction" },
    { title: "The problem" },
    { title: "How it works" },
    { title: "Conclusion" },
  ];
  const allocation = allocateWords(900, sections);
  assert.equal(allocation.length, sections.length);
  assert.equal(
    allocation.reduce((sum, value) => sum + value, 0),
    900,
    "sections must add up to the requested total",
  );
});

test("allocateWords weights introductions and conclusions below body sections", () => {
  const [intro, body] = allocateWords(1000, [
    { title: "Introduction" },
    { title: "Main argument" },
  ]);
  assert.ok(intro < body, `expected intro (${intro}) below body (${body})`);
});

test("allocateWords returns an empty array when there are no sections", () => {
  assert.deepEqual(allocateWords(500, []), []);
});

test("allocateWords never returns a section below the floor", () => {
  const many = Array.from({ length: 7 }, (_, index) => ({ title: `Part ${index}` }));
  const allocation = allocateWords(150, many);
  assert.ok(allocation.every((value) => value >= 40));
});

test("lengthIdToWords maps lengths to their targets", () => {
  assert.equal(lengthIdToWords("short"), 400);
  assert.equal(lengthIdToWords("medium"), 900);
  assert.equal(lengthIdToWords("long"), 1800);
  assert.equal(lengthIdToWords("custom", 2500), 2500);
});
