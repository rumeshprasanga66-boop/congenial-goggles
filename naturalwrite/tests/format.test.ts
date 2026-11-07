import test from "node:test";
import assert from "node:assert/strict";

import {
  formatNumber,
  formatCompact,
  countWords,
  formatRelativeTime,
  formatDate,
  greeting,
} from "@/lib/format";
import {
  isToneId,
  isLengthId,
  isContentType,
  clampWordCount,
  targetWordCount,
  getContentType,
  getTone,
  TONES,
  CONTENT_TYPES,
  LENGTHS,
} from "@/lib/ai/options";

test("formatNumber uses thousands separators", () => {
  assert.equal(formatNumber(0), "0");
  assert.equal(formatNumber(1234), "1,234");
  assert.equal(formatNumber(1000000), "1,000,000");
});

test("formatCompact abbreviates large numbers", () => {
  assert.equal(formatCompact(1500), "1.5K");
  assert.equal(formatCompact(2_000_000), "2M");
});

test("countWords ignores surrounding whitespace", () => {
  assert.equal(countWords(""), 0);
  assert.equal(countWords("   "), 0);
  assert.equal(countWords("one"), 1);
  assert.equal(countWords("  one   two  three "), 3);
  assert.equal(countWords("line one\nline two"), 4);
});

test("formatRelativeTime describes recent and older times", () => {
  const now = Date.parse("2026-01-10T12:00:00Z");
  assert.equal(formatRelativeTime("2026-01-10T11:59:50Z", now), "Just now");
  assert.equal(formatRelativeTime("2026-01-10T11:30:00Z", now), "30 minutes ago");
  assert.equal(formatRelativeTime("2026-01-10T09:00:00Z", now), "3 hours ago");
  assert.equal(formatRelativeTime("2026-01-08T12:00:00Z", now), "2 days ago");
});

test("formatRelativeTime is stable for an invalid date", () => {
  assert.equal(formatRelativeTime("not-a-date"), "Unknown");
});

test("formatDate renders a readable date and falls back on bad input", () => {
  assert.equal(formatDate("2026-03-05T00:00:00Z"), "Mar 5, 2026");
  assert.equal(formatDate("nonsense"), "Unknown");
});

test("greeting changes with the hour", () => {
  assert.equal(greeting(new Date("2026-01-01T08:00:00")), "Good morning");
  assert.equal(greeting(new Date("2026-01-01T14:00:00")), "Good afternoon");
  assert.equal(greeting(new Date("2026-01-01T21:00:00")), "Good evening");
});

test("option guards accept known ids and reject unknown ones", () => {
  assert.equal(isToneId("professional"), true);
  assert.equal(isToneId("shouty"), false);
  assert.equal(isLengthId("custom"), true);
  assert.equal(isLengthId("epic"), false);
  assert.equal(isContentType("blog_post"), true);
  assert.equal(isContentType("tweet"), false);
});

test("every tone and content type has a unique id and a description", () => {
  const toneIds = TONES.map((tone) => tone.id);
  assert.equal(new Set(toneIds).size, toneIds.length);
  assert.ok(TONES.every((tone) => tone.description.length > 0));

  const typeIds = CONTENT_TYPES.map((type) => type.id);
  assert.equal(new Set(typeIds).size, typeIds.length);
  assert.ok(CONTENT_TYPES.every((type) => type.defaultSections.length > 0));

  const lengthIds = LENGTHS.map((length) => length.id);
  assert.equal(new Set(lengthIds).size, lengthIds.length);
});

test("getContentType and getTone fall back safely for unknown ids", () => {
  assert.equal(getContentType("blog_post").label, "Blog post");
  assert.equal(getTone("direct").label, "Direct");
  // @ts-expect-error deliberately passing an invalid id to prove the fallback
  assert.ok(getContentType("nope").id);
  // @ts-expect-error deliberately passing an invalid id to prove the fallback
  assert.ok(getTone("nope").id);
});

test("clampWordCount keeps values inside the supported range", () => {
  assert.equal(clampWordCount(10), 150);
  assert.equal(clampWordCount(99999), 5000);
  assert.equal(clampWordCount(1200), 1200);
  assert.equal(clampWordCount(1200.4), 1200);
  assert.equal(clampWordCount("nonsense"), 900);
  assert.equal(clampWordCount(undefined), 900);
});

test("targetWordCount maps every length option", () => {
  assert.equal(targetWordCount("short"), 400);
  assert.equal(targetWordCount("medium"), 900);
  assert.equal(targetWordCount("long"), 1800);
  assert.equal(targetWordCount("custom", 1234), 1234);
  assert.equal(targetWordCount("custom"), 900);
});
