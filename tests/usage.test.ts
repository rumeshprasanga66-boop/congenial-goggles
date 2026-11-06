import test from "node:test";
import assert from "node:assert/strict";

import { estimateCost, summarizeUsage, recordUsage, listUsage } from "@/lib/usage";
import type { UsageRecord } from "@/lib/types";

function record(partial: Partial<UsageRecord>): UsageRecord {
  return {
    id: "r",
    operation: "section",
    model: "gpt-4.1-mini",
    inputTokens: 0,
    outputTokens: 0,
    estimatedCost: 0,
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

test("estimateCost returns null when no price is configured for the model", () => {
  const previous = process.env.MODEL_PRICING_JSON;
  delete process.env.MODEL_PRICING_JSON;
  assert.equal(estimateCost("gpt-4.1-mini", 1000, 1000), null);
  if (previous !== undefined) process.env.MODEL_PRICING_JSON = previous;
});

test("estimateCost computes a real cost from configured pricing", () => {
  const previous = process.env.MODEL_PRICING_JSON;
  process.env.MODEL_PRICING_JSON = JSON.stringify({
    "test-model": { input: 1, output: 2 },
  });

  // 1,000,000 input tokens at $1/M plus 500,000 output at $2/M = $2.
  assert.equal(estimateCost("test-model", 1_000_000, 500_000), 2);
  assert.equal(estimateCost("unknown-model", 1_000_000, 0), null);

  if (previous === undefined) delete process.env.MODEL_PRICING_JSON;
  else process.env.MODEL_PRICING_JSON = previous;
});

test("estimateCost ignores malformed pricing config instead of throwing", () => {
  const previous = process.env.MODEL_PRICING_JSON;
  process.env.MODEL_PRICING_JSON = "{not json";
  assert.equal(estimateCost("any", 100, 100), null);
  if (previous === undefined) delete process.env.MODEL_PRICING_JSON;
  else process.env.MODEL_PRICING_JSON = previous;
});

test("summarizeUsage totals tokens across records", () => {
  const summary = summarizeUsage([
    record({ inputTokens: 100, outputTokens: 200 }),
    record({ inputTokens: 50, outputTokens: 25 }),
  ]);
  assert.equal(summary.requests, 2);
  assert.equal(summary.inputTokens, 150);
  assert.equal(summary.outputTokens, 225);
  assert.equal(summary.totalTokens, 375);
});

test("summarizeUsage reports cost as null when nothing is priced", () => {
  const summary = summarizeUsage([record({ inputTokens: 10, outputTokens: 10 })]);
  assert.equal(summary.estimatedCost, null);
});

test("summarizeUsage sums only the priced records", () => {
  const summary = summarizeUsage([
    record({ estimatedCost: 0.5 }),
    record({ estimatedCost: 0.25 }),
    record({ estimatedCost: 0 }),
  ]);
  assert.equal(summary.estimatedCost, 0.75);
});

test("summarizeUsage handles an empty log", () => {
  const summary = summarizeUsage([]);
  assert.deepEqual(summary, {
    requests: 0,
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    estimatedCost: null,
  });
});

test("recordUsage appends to the log and listUsage reads it back", async () => {
  const before = (await listUsage()).length;
  await recordUsage({
    operation: "outline",
    model: "gpt-4.1-mini",
    inputTokens: 120,
    outputTokens: 340,
  });
  const after = await listUsage();
  assert.equal(after.length, before + 1);
  assert.equal(after[0].operation, "outline");
  assert.equal(after[0].inputTokens, 120);
  assert.equal(after[0].outputTokens, 340);
});
