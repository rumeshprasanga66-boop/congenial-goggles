import test from "node:test";
import assert from "node:assert/strict";

import {
  analyseSeo,
  countPhraseOccurrences,
  countProseWords,
  extractHeadings,
  findHeadingOrderIssues,
  firstParagraph,
  scoreBand,
} from "@/lib/seo/analyse";
import { buildSeoOutline, planSeo, titleCaseKeyword } from "@/lib/seo/plan";
import { POST as analyseRoute } from "@/app/api/seo/analyse/route";

/**
 * The SEO report is computed from the text, so it can be tested exactly. These
 * tests exercise the real analyser and the real route handler; nothing is
 * stubbed.
 */

function jsonRequest(body: unknown): Request {
  return new Request("http://test/api/seo/analyse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("countPhraseOccurrences matches whole words only", () => {
  // A naive substring search would count "art" inside "start" and "partly".
  assert.equal(countPhraseOccurrences("start partly art", "art"), 1);
  assert.equal(countPhraseOccurrences("Art and art and ART", "art"), 3);
  assert.equal(countPhraseOccurrences("onboarding drop-off", "onboarding drop-off"), 1);
  assert.equal(countPhraseOccurrences("Onboarding Drop-Off matters", "onboarding drop-off"), 1);
});

test("countPhraseOccurrences does not match inside words with digits", () => {
  assert.equal(countPhraseOccurrences("h2o is water", "h2o"), 1);
  assert.equal(countPhraseOccurrences("subh2o", "h2o"), 0);
});

test("extractHeadings reads markdown levels in order and ignores body text", () => {
  const text = [
    "# Title",
    "Some body text",
    "## First section",
    "### Nested",
    "## Second section",
  ].join("\n");
  assert.deepEqual(extractHeadings(text), [
    { level: 1, text: "Title" },
    { level: 2, text: "First section" },
    { level: 3, text: "Nested" },
    { level: 2, text: "Second section" },
  ]);
});

test("firstParagraph skips headings and blank lines", () => {
  assert.equal(firstParagraph("# Title\n\n\nOpening line here."), "Opening line here.");
  assert.equal(firstParagraph(""), "");
});

test("findHeadingOrderIssues reports a skipped level", () => {
  const issues = findHeadingOrderIssues([
    { level: 2, text: "A" },
    { level: 4, text: "B" },
  ]);
  assert.equal(issues.length, 1);
  assert.match(issues[0]!, /h4/);
  assert.match(issues[0]!, /h2/);
});

test("findHeadingOrderIssues allows a descent of one level", () => {
  assert.deepEqual(
    findHeadingOrderIssues([
      { level: 1, text: "A" },
      { level: 2, text: "B" },
      { level: 3, text: "C" },
      { level: 2, text: "D" },
    ]),
    [],
  );
});

test("analyseSeo reports keyword placement and density", () => {
  const text = [
    "# Onboarding drop-off",
    "",
    "Onboarding drop-off is the share of new accounts that never activate.",
    "## Why onboarding drop-off happens",
    "",
    "Most onboarding drop-off comes from too many steps.",
  ].join("\n");

  const report = analyseSeo({ text, keyword: "onboarding drop-off" });

  assert.equal(report.keywordCount, 4);
  assert.equal(report.keywordInTitle, true);
  assert.equal(report.keywordInFirstParagraph, true);
  assert.equal(report.keywordInHeadings, true);
  // Markdown "#" markers must not count as words.
  assert.equal(report.wordCount, 25);
  assert.ok(report.keywordDensity > 0);
  assert.equal(report.headingOrderIssues.length, 0);
});

test("toPlainText strips markdown so counts measure prose", () => {
  assert.equal(countProseWords("# Title\n\nbody text"), 3);
  assert.equal(countProseWords("**bold** and `code`"), 3);
  assert.equal(countProseWords("[link](https://example.com/a) text"), 2);
  assert.equal(countProseWords("- one\n- two"), 2);
  // A keyword buried in a link URL is not body text.
  assert.equal(
    countPhraseOccurrences("[guide](https://example.com/seo-guide) here", "seo-guide"),
    0,
  );
});

test("analyseSeo fails the title check when the keyword is absent", () => {
  const report = analyseSeo({
    text: "# Something else entirely\n\nA short line.",
    keyword: "onboarding drop-off",
  });
  const titleCheck = report.checks.find((check) => check.id === "keyword-in-title");
  assert.equal(titleCheck?.status, "fail");
  assert.ok(titleCheck?.advice);
});

test("analyseSeo warns when no keyword is given rather than inventing one", () => {
  const report = analyseSeo({ text: "# Title\n\n" + "word ".repeat(400), keyword: "" });
  const keywordCheck = report.checks.find((check) => check.id === "keyword");
  assert.equal(keywordCheck?.status, "fail");
  assert.match(keywordCheck!.detail, /No keyword was given/);
  // Keyword-specific checks are skipped entirely when there is no keyword.
  assert.equal(report.checks.some((check) => check.id === "keyword-density"), false);
});

test("analyseSeo flags keyword stuffing", () => {
  const text = "# Cheap flights\n\n" + "cheap flights ".repeat(60);
  const report = analyseSeo({ text, keyword: "cheap flights" });
  const density = report.checks.find((check) => check.id === "keyword-density");
  assert.equal(density?.status, "warn");
  assert.match(density!.advice!, /repetition/);
});

const GOOD_DRAFT = [
  "# Onboarding drop-off",
  "",
  "Onboarding drop-off is the share of new accounts that never reach the first",
  "action that shows them value. It is worth measuring because every account that",
  "stalls is a cost you have already paid to acquire.",
  "",
  "## Why the first session decides",
  "",
  "Most teams look at activation at the end of the first week, which is too late to",
  "learn anything. A drop-off that happens on day one has a different cause from one",
  "that happens on day ten. Instrument the first session separately so the two do not",
  "blur together in a single funnel chart.",
  "",
  "The usual culprits are familiar. A signup form asks for information the product",
  "does not need yet. A setup step waits on something the user does not have to hand.",
  "An empty state shows a blank page instead of an example. None of these is",
  "individually fatal, but they compound, and each one gives the user a reason to",
  "close the tab and come back later, which usually means never.",
  "",
  "## Measuring it honestly",
  "",
  "Pick one action that means the product worked, and count the share of new accounts",
  "that reach it. Resist the temptation to count logins as success, because a login",
  "records an intention rather than an outcome. Then segment by acquisition channel.",
  "A drop-off concentrated in one channel is a messaging problem, while a drop-off",
  "spread evenly across all of them is a product problem, and the two need different",
  "fixes.",
  "",
  "## Fixing it",
  "",
  "Remove steps before adding guidance. A tooltip on top of an unnecessary form field",
  "is worse than deleting the field. Where a step genuinely has to stay, move it after",
  "the moment the user first gets value, so the work is paid for by something they",
  "have already seen.",
  "",
  "Then test one change at a time. Teams often ship a new onboarding flow, a new email",
  "sequence and a new empty state in the same week, and learn nothing about which one",
  "mattered. A single change with a clear hypothesis tells you more than three shipped",
  "together.",
  "",
  "## What good looks like",
  "",
  "The best onboarding flows feel short because the work happens at the right moment.",
  "The user reaches something useful, understands what it did, and only then is asked",
  "for the details that make the account complete. Watch the first session, not the",
  "first month, and the drop-off becomes something you can act on.",
].join("\n");

test("analyseSeo scores every check and stays within 0-100", () => {
  const good = analyseSeo({ text: GOOD_DRAFT, keyword: "onboarding drop-off" });
  const bad = analyseSeo({ text: "tiny", keyword: "onboarding drop-off" });

  assert.ok(good.score > bad.score, "a well-formed draft should score above a stub");
  for (const score of [good.score, bad.score]) {
    assert.ok(score >= 0 && score <= 100);
  }
  assert.equal(scoreBand(good.score), "good");
  assert.equal(scoreBand(bad.score), "weak");
  // Every check on a well-formed draft should pass or warn, never fail.
  const failing = good.checks.filter((check) => check.status === "fail");
  assert.deepEqual(failing, []);
});

test("analyseSeo counts secondary phrase coverage", () => {
  const report = analyseSeo({
    text: "# Title\n\nactivation rate is the number that matters.",
    keyword: "activation",
    secondaryKeywords: ["activation rate", "churn", "  "],
  });
  assert.deepEqual(
    report.secondaryCoverage.map((entry) => entry.keyword),
    ["activation rate", "churn"],
  );
  assert.equal(report.secondaryCoverage[0]!.present, true);
  assert.equal(report.secondaryCoverage[1]!.present, false);
});

test("titleCaseKeyword keeps acronyms and minor words", () => {
  assert.equal(titleCaseKeyword("onboarding drop-off"), "Onboarding Drop-off");
  // An already-uppercase acronym survives; a lower-case one is title-cased,
  // because nothing in the string marks it as an acronym.
  assert.equal(titleCaseKeyword("SEO for B2B SaaS"), "SEO for B2B SaaS");
  assert.equal(titleCaseKeyword("seo for teams"), "Seo for Teams");
  assert.equal(titleCaseKeyword("the cost of waiting"), "The Cost of Waiting");
});

test("buildSeoOutline returns nothing for an empty keyword", () => {
  const report = analyseSeo({ text: "body text", keyword: "" });
  assert.deepEqual(buildSeoOutline("", report), []);
});

test("buildSeoOutline produces keyword-bearing sections", () => {
  const report = analyseSeo({ text: "", keyword: "onboarding drop-off" });
  const sections = buildSeoOutline("onboarding drop-off", report);
  assert.ok(sections.length >= 3);
  assert.ok(sections.some((section) => section.title.includes("onboarding drop-off")));
  for (const section of sections) {
    assert.ok(section.title.length > 0);
    assert.ok(section.rationale.length > 0);
  }
});

test("planSeo scales section targets to the requested length", () => {
  const short = planSeo({
    topic: "x",
    keyword: "onboarding drop-off",
    contentType: "blog_post",
    tone: "natural",
    length: "short",
  });
  const long = planSeo({
    topic: "x",
    keyword: "onboarding drop-off",
    contentType: "blog_post",
    tone: "natural",
    length: "long",
  });

  const total = (plan: typeof short) =>
    plan.sections.reduce((sum, section) => sum + section.wordTarget, 0);

  assert.ok(total(long) > total(short));
  assert.ok(Math.abs(total(short) - 500) <= short.sections.length * 5);
});

test("planSeo lists priorities from failing checks", () => {
  const plan = planSeo({
    topic: "x",
    keyword: "onboarding drop-off",
    contentType: "blog_post",
    tone: "natural",
    length: "medium",
    draft: "too short to pass anything",
  });
  assert.ok(plan.priorities.length > 0);
  assert.ok(plan.priorities.every((entry) => entry.length > 0));
});

test("the analyse route returns a report for valid input", async () => {
  const response = await analyseRoute(
    jsonRequest({ text: "# Title\n\nonboarding drop-off matters here.", keyword: "onboarding drop-off" }),
  );
  assert.equal(response.status, 200);
  const payload = (await response.json()) as { report: { wordCount: number; keywordCount: number } };
  assert.equal(payload.report.keywordCount, 1);
  assert.ok(payload.report.wordCount > 0);
});

test("the analyse route rejects empty text and malformed JSON", async () => {
  const empty = await analyseRoute(jsonRequest({ text: "   ", keyword: "x" }));
  assert.equal(empty.status, 400);
  const body = (await empty.json()) as { error: string };
  assert.match(body.error, /text to analyse/);

  const malformed = await analyseRoute(
    new Request("http://test/api/seo/analyse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ not json",
    }),
  );
  assert.equal(malformed.status, 400);
});

test("the analyse route works without any AI provider configured", async () => {
  // SEO analysis must not depend on a model key: it is pure computation.
  const previous = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  const response = await analyseRoute(
    jsonRequest({ text: "Some text about onboarding drop-off and activation.", keyword: "onboarding" }),
  );
  assert.equal(response.status, 200);
  if (previous !== undefined) process.env.OPENAI_API_KEY = previous;
});

test("the analyse route caps oversized input", async () => {
  const response = await analyseRoute(
    jsonRequest({ text: "a ".repeat(40000), keyword: "a" }),
  );
  assert.equal(response.status, 400);
  const payload = (await response.json()) as { error: string };
  assert.match(payload.error, /characters or fewer/);
});
