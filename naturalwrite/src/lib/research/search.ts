import "server-only";

/**
 * Web search for the research assistant.
 *
 * This is the only module that talks to a search provider. Keys are read from
 * server-side environment variables, so nothing reaches the browser. When no
 * provider is configured, `isResearchConfigured()` is false and the route
 * reports that research is unavailable instead of returning invented sources.
 *
 * Two providers are supported because both are widely available and return a
 * similar shape. The assistant never fabricates a result: if the provider
 * returns nothing, the caller shows nothing.
 */

export interface SearchResult {
  title: string;
  url: string;
  /** Provider-supplied snippet. Empty when the provider gives none. */
  snippet: string;
  /** Publication date when the provider reports one. */
  publishedDate: string | null;
}

export interface SearchResponse {
  query: string;
  provider: "tavily" | "brave";
  results: SearchResult[];
}

export class ResearchNotConfiguredError extends Error {
  constructor() {
    super(
      "No search provider is configured. Set TAVILY_API_KEY or BRAVE_SEARCH_API_KEY in the server environment to enable research.",
    );
    this.name = "ResearchNotConfiguredError";
  }
}

export class ResearchRequestError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ResearchRequestError";
    this.status = status;
  }
}

/** Provider selection: Tavily wins when both are set, since it is search-first. */
export function getProvider(): "tavily" | "brave" | null {
  if (process.env.TAVILY_API_KEY) return "tavily";
  if (process.env.BRAVE_SEARCH_API_KEY) return "brave";
  return null;
}

export function isResearchConfigured(): boolean {
  return getProvider() !== null;
}

const MAX_RESULTS = 8;
const TIMEOUT_MS = 12_000;

/**
 * Provider endpoints. Overridable so a deployment can route through a proxy or
 * a self-hosted gateway, and so the network path can be tested against a local
 * server rather than the live provider.
 */
function tavilyBaseUrl(): string {
  return process.env.TAVILY_BASE_URL?.trim() || "https://api.tavily.com";
}

function braveBaseUrl(): string {
  return (
    process.env.BRAVE_SEARCH_BASE_URL?.trim() || "https://api.search.brave.com/res/v1"
  );
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (cause) {
    if (cause instanceof Error && cause.name === "AbortError") {
      throw new ResearchRequestError("The search provider took too long to respond.", 504);
    }
    throw new ResearchRequestError(
      `Could not reach the search provider: ${cause instanceof Error ? cause.message : "network error"}`,
      502,
    );
  } finally {
    clearTimeout(timer);
  }
}

interface TavilyResult {
  title?: string;
  url?: string;
  content?: string;
  published_date?: string;
}

interface TavilyResponse {
  results?: TavilyResult[];
  detail?: { error?: string } | string;
}

async function searchTavily(query: string, count: number): Promise<SearchResult[]> {
  const response = await fetchWithTimeout(`${tavilyBaseUrl()}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TAVILY_API_KEY}`,
    },
    body: JSON.stringify({
      query,
      max_results: count,
      search_depth: "basic",
      include_answer: false,
    }),
  });

  const raw = await response.text();
  let parsed: TavilyResponse = {};
  try {
    parsed = raw ? (JSON.parse(raw) as TavilyResponse) : {};
  } catch {
    // Reported below with the status code.
  }

  if (!response.ok) {
    const detail =
      typeof parsed.detail === "string"
        ? parsed.detail
        : parsed.detail?.error ??
          `The search provider returned ${response.status} ${response.statusText}`;
    throw new ResearchRequestError(detail, response.status);
  }

  return (parsed.results ?? [])
    .filter((result) => result.url && result.title)
    .map((result) => ({
      title: result.title!.trim(),
      url: result.url!.trim(),
      snippet: (result.content ?? "").trim(),
      publishedDate: result.published_date?.trim() || null,
    }));
}

interface BraveResponse {
  web?: {
    results?: Array<{
      title?: string;
      url?: string;
      description?: string;
      age?: string;
      page_age?: string;
    }>;
  };
  error?: { detail?: string } | string;
}

async function searchBrave(query: string, count: number): Promise<SearchResult[]> {
  const url = new URL(`${braveBaseUrl()}/web/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(count));

  const response = await fetchWithTimeout(url.toString(), {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": process.env.BRAVE_SEARCH_API_KEY ?? "",
    },
  });

  const raw = await response.text();
  let parsed: BraveResponse = {};
  try {
    parsed = raw ? (JSON.parse(raw) as BraveResponse) : {};
  } catch {
    // Reported below with the status code.
  }

  if (!response.ok) {
    const detail =
      typeof parsed.error === "string"
        ? parsed.error
        : parsed.error?.detail ??
          `The search provider returned ${response.status} ${response.statusText}`;
    throw new ResearchRequestError(detail, response.status);
  }

  return (parsed.web?.results ?? [])
    .filter((result) => result.url && result.title)
    .map((result) => ({
      title: result.title!.trim(),
      url: result.url!.trim(),
      snippet: (result.description ?? "").replace(/<[^>]+>/g, "").trim(),
      publishedDate: (result.page_age ?? result.age ?? "").trim() || null,
    }));
}

/**
 * Run a search. The provider is chosen from the environment; the returned
 * results are exactly what the provider sent, in its order.
 */
export async function searchWeb(
  query: string,
  options: { count?: number } = {},
): Promise<SearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) {
    throw new ResearchRequestError("A search query is required.", 400);
  }

  const provider = getProvider();
  if (!provider) throw new ResearchNotConfiguredError();

  const count = Math.min(Math.max(options.count ?? 5, 1), MAX_RESULTS);
  const results =
    provider === "tavily"
      ? await searchTavily(trimmed, count)
      : await searchBrave(trimmed, count);

  return { query: trimmed, provider, results: results.slice(0, count) };
}

/**
 * A stable source label for the UI: the registrable host without "www.".
 * Falls back to the raw string when the URL does not parse, which is better
 * than hiding a source that was returned.
 */
export function sourceLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
