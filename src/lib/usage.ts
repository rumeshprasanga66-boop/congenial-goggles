import "server-only";

import type { UsageRecord } from "@/lib/types";

/**
 * Usage accounting.
 *
 * Records live in memory for the lifetime of the server process. That is enough
 * to show a working log and real token counts during development, but it is not
 * durable, so the usage page says so plainly. Phase 5 moves this to the
 * usage_records table with the same interface.
 *
 * Costs are only computed when a price is configured, because guessing a price
 * would produce a number that looks authoritative and is wrong.
 */

export interface UsageInput {
  operation: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

const MAX_RECORDS = 500;
const records: UsageRecord[] = [];
let sequence = 0;

/** USD per one million tokens, read from the environment when set. */
function pricePerMillionTokens(model: string): { input: number; output: number } | null {
  const raw = process.env.MODEL_PRICING_JSON;
  if (!raw) return null;
  try {
    const table = JSON.parse(raw) as Record<
      string,
      { input?: number; output?: number }
    >;
    const entry = table[model];
    if (!entry) return null;
    const input = Number(entry.input);
    const output = Number(entry.output);
    if (!Number.isFinite(input) || !Number.isFinite(output)) return null;
    return { input, output };
  } catch {
    return null;
  }
}

/** Estimated cost in USD, or null when no price is configured for the model. */
export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number | null {
  const price = pricePerMillionTokens(model);
  if (!price) return null;
  const cost =
    (inputTokens / 1_000_000) * price.input +
    (outputTokens / 1_000_000) * price.output;
  return Math.round(cost * 1_000_000) / 1_000_000;
}

export async function recordUsage(input: UsageInput): Promise<void> {
  sequence += 1;
  const estimated = estimateCost(input.model, input.inputTokens, input.outputTokens);
  records.unshift({
    id: `local-${sequence}`,
    operation: input.operation,
    model: input.model,
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
    estimatedCost: estimated ?? 0,
    createdAt: new Date().toISOString(),
  });
  if (records.length > MAX_RECORDS) records.length = MAX_RECORDS;
}

export async function listUsage(): Promise<UsageRecord[]> {
  return [...records];
}

export interface UsageSummary {
  requests: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  /** Null when no model in the log has a configured price. */
  estimatedCost: number | null;
}

/** Pure aggregation so it can be tested without touching the store. */
export function summarizeUsage(entries: UsageRecord[]): UsageSummary {
  const inputTokens = entries.reduce((sum, entry) => sum + entry.inputTokens, 0);
  const outputTokens = entries.reduce((sum, entry) => sum + entry.outputTokens, 0);
  const priced = entries.filter((entry) => entry.estimatedCost > 0);
  const estimatedCost =
    priced.length > 0
      ? Math.round(
          priced.reduce((sum, entry) => sum + entry.estimatedCost, 0) * 1_000_000,
        ) / 1_000_000
      : null;

  return {
    requests: entries.length,
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    estimatedCost,
  };
}
