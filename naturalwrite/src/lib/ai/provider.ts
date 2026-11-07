import "server-only";

/**
 * AI provider access.
 *
 * This module is the only place that talks to a model provider. It reads its
 * configuration from server-side environment variables, so no key can reach the
 * browser. When no key is configured, `isAiConfigured()` is false and callers
 * report that generation is unavailable rather than pretending it worked.
 */

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

export interface CompletionResult {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export class AiNotConfiguredError extends Error {
  constructor() {
    super(
      "No AI provider is configured. Set OPENAI_API_KEY in the server environment to enable generation.",
    );
    this.name = "AiNotConfiguredError";
  }
}

export class AiRequestError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "AiRequestError";
    this.status = status;
  }
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/** Model identifier, overridable so a deployment can pin a specific version. */
export function getModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini";
}

export function getProviderBaseUrl(): string {
  return process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1";
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string | null } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string };
}

/**
 * Single completion call. `json` requests a JSON response format, which the
 * provider enforces, so callers can parse without defensive regex extraction.
 */
export async function complete(
  messages: ChatMessage[],
  options: { json?: boolean; maxTokens?: number; temperature?: number } = {},
): Promise<CompletionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new AiNotConfiguredError();

  const model = getModel();
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: options.temperature ?? 0.7,
  };
  if (options.maxTokens) body.max_tokens = options.maxTokens;
  if (options.json) body.response_format = { type: "json_object" };

  let response: Response;
  try {
    response = await fetch(`${getProviderBaseUrl()}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch (cause) {
    throw new AiRequestError(
      `Could not reach the AI provider: ${cause instanceof Error ? cause.message : "network error"}`,
      502,
    );
  }

  const raw = await response.text();
  let parsed: ChatCompletionResponse = {};
  try {
    parsed = raw ? (JSON.parse(raw) as ChatCompletionResponse) : {};
  } catch {
    // Fall through to the status check below, which reports the raw body.
  }

  if (!response.ok) {
    const detail =
      parsed.error?.message ??
      `The provider returned ${response.status} ${response.statusText}`;
    throw new AiRequestError(detail, response.status);
  }

  const text = parsed.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new AiRequestError("The provider returned an empty response.", 502);
  }

  return {
    text,
    model,
    inputTokens: parsed.usage?.prompt_tokens ?? 0,
    outputTokens: parsed.usage?.completion_tokens ?? 0,
  };
}

/**
 * Extract the first JSON object from model output. Requesting a JSON response
 * format usually makes this unnecessary, but models occasionally wrap output in
 * prose or fences, so this keeps a malformed response from crashing the page.
 */
export function extractJson<T>(text: string): T | null {
  const trimmed = text.trim();
  const candidates: string[] = [trimmed];

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) candidates.push(fenced[1].trim());

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end > start) candidates.push(trimmed.slice(start, end + 1));

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      continue;
    }
  }
  return null;
}
