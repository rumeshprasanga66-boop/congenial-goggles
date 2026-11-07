"use client";

import { useState } from "react";

/**
 * Typed fetch helper for the generation API.
 *
 * The routes return `{ error, details? }` on failure, so this unwraps that into
 * an Error whose message is safe to show. Network failures are surfaced rather
 * than swallowed, because the user needs to know a request did not happen.
 */

export class GenerationError extends Error {
  readonly details: string[];
  readonly status: number;

  constructor(message: string, status: number, details: string[] = []) {
    super(message);
    this.name = "GenerationError";
    this.status = status;
    this.details = details;
  }
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new GenerationError(
      "Could not reach the server. Check your connection and try again.",
      0,
    );
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const record = (payload ?? {}) as { error?: unknown; details?: unknown };
    const message =
      typeof record.error === "string"
        ? record.error
        : `The request failed with status ${response.status}.`;
    const details = Array.isArray(record.details)
      ? record.details.filter((item): item is string => typeof item === "string")
      : [];
    throw new GenerationError(message, response.status, details);
  }

  return payload as T;
}

/** Tracks which requests are in flight so buttons can disable themselves. */
export function useAsyncLock() {
  const [pending, setPending] = useState(false);
  return {
    pending,
    async run<T>(task: () => Promise<T>): Promise<T> {
      setPending(true);
      try {
        return await task();
      } finally {
        setPending(false);
      }
    },
  };
}
