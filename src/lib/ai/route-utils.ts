import "server-only";

import { NextResponse } from "next/server";
import { AiNotConfiguredError, AiRequestError } from "@/lib/ai/provider";
import { isAiConfigured } from "@/lib/ai/provider";

/**
 * Shared response handling for the generation routes.
 *
 * Centralising this keeps every route reporting failures the same way, and
 * guarantees the browser receives a useful message rather than a stack trace.
 */

export interface ApiError {
  error: string;
  /** Field-level problems, when the request body failed validation. */
  details?: string[];
}

export function jsonError(
  message: string,
  status: number,
  details?: string[],
): NextResponse<ApiError> {
  return NextResponse.json<ApiError>({ error: message, details }, { status });
}

/**
 * Reject generation requests when no provider key exists. Returns a response to
 * send, or null when the request may proceed.
 */
export function guardAiConfigured(): NextResponse<ApiError> | null {
  if (isAiConfigured()) return null;
  return jsonError(
    "AI generation is not configured on this deployment. An administrator needs to set OPENAI_API_KEY.",
    503,
  );
}

/** Parse a JSON body, returning null when it is absent or malformed. */
export async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** Map a thrown error to a response, keeping provider messages user-readable. */
export function handleRouteError(error: unknown): NextResponse<ApiError> {
  if (error instanceof AiNotConfiguredError) {
    return jsonError(error.message, 503);
  }
  if (error instanceof AiRequestError) {
    // Rate limits and upstream faults should be retryable, so pass 429 through
    // and treat other provider errors as a bad gateway.
    const status = error.status === 429 ? 429 : 502;
    return jsonError(error.message, status);
  }
  const message =
    error instanceof Error ? error.message : "Something went wrong while generating.";
  return jsonError(message, 500);
}

/**
 * Simple per-instance rate limit. This is a guard against accidental request
 * loops, not a billing control; real per-account limits arrive with auth.
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const hits = new Map<string, number[]>();

export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
