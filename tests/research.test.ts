import test from "node:test";
import assert from "node:assert/strict";

import {
  getProvider,
  isResearchConfigured,
  searchWeb,
  sourceLabel,
  ResearchNotConfiguredError,
  ResearchRequestError,
} from "@/lib/research/search";
import {
  buildSummarisePrompt,
  indexSources,
  parseCitations,
} from "@/lib/research/summarize";
import { POST as searchRoute } from "@/app/api/research/search/route";
import { POST as summarizeRoute } from "@/app/api/research/summarize/route";

/**
 * Research tests.
 *
 * The provider endpoints are hard-coded in the module, so these tests cover the
 * parts that do not need the network: provider selection, configuration
 * reporting, request validation, the prompt builder and citation parsing. The
 * live network path is verified manually against a stand-in provider. The
 * unconfigured case is asserted here because it is what a stock deployment hits.
 */

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function clearProviderKeys(): void {
  delete process.env.TAVILY_API_KEY;
  delete process.env.BRAVE_SEARCH_API_KEY;
}

test("no provider is reported as unconfigured", () => {
  const previous = {
    tavily: process.env.TAVILY_API_KEY,
    brave: process.env.BRAVE_SEARCH_API_KEY,
  };
  clearProviderKeys();

  assert.equal(getProvider(), null);
  assert.equal(isResearchConfigured(), false);

  if (previous.tavily !== undefined) process.env.TAVILY_API_KEY = previous.tavily;
  if (previous.brave !== undefined) process.env.BRAVE_SEARCH_API_KEY = previous.brave;
});

test("tavily wins when both provider keys are set", () => {
  const previous = {
    tavily: process.env.TAVILY_API_KEY,
    brave: process.env.BRAVE_SEARCH_API_KEY,
  };
  process.env.TAVILY_API_KEY = "test-tavily";
  process.env.BRAVE_SEARCH_API_KEY = "test-brave";

  assert.equal(getProvider(), "tavily");
  assert.equal(isResearchConfigured(), true);

  delete process.env.TAVILY_API_KEY;
  assert.equal(getProvider(), "brave");

  clearProviderKeys();
  if (previous.tavily !== undefined) process.env.TAVILY_API_KEY = previous.tavily;
  if (previous.brave !== undefined) process.env.BRAVE_SEARCH_API_KEY = previous.brave;
});

test("searchWeb refuses to run without a provider", async () => {
  const previous = process.env.TAVILY_API_KEY;
  delete process.env.TAVILY_API_KEY;
  const previousBrave = process.env.BRAVE_SEARCH_API_KEY;
  delete process.env.BRAVE_SEARCH_API_KEY;

  await assert.rejects(
    () => searchWeb("anything"),
    (error: unknown) => error instanceof ResearchNotConfiguredError,
  );

  if (previous !== undefined) process.env.TAVILY_API_KEY = previous;
  if (previousBrave !== undefined) process.env.BRAVE_SEARCH_API_KEY = previousBrave;
});

test("searchWeb rejects an empty query", async () => {
  const previous = process.env.TAVILY_API_KEY;
  process.env.TAVILY_API_KEY = "test-tavily";

  await assert.rejects(
    () => searchWeb("   "),
    (error: unknown) => error instanceof ResearchRequestError && error.status === 400,
  );

  if (previous === undefined) delete process.env.TAVILY_API_KEY;
  else process.env.TAVILY_API_KEY = previous;
});

test("searchWeb parses a real provider response over HTTP", async () => {
  // A real server, not a mock: the module's fetch path runs end to end.
  const { createServer } = await import("node:http");
  const received: { url?: string; auth?: string; body?: string } = {};
  const server = createServer((request, response) => {
    received.url = request.url;
    received.auth = request.headers.authorization;
    let body = "";
    request.on("data", (chunk) => (body += chunk));
    request.on("end", () => {
      received.body = body;
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({
          results: [
            {
              title: "  Spaced title  ",
              url: "https://example.com/a",
              content: "  snippet text  ",
              published_date: " 2024-05-01 ",
            },
            // Entries without a URL or title are dropped, not shown blank.
            { content: "no url" },
            { title: "no url either" },
          ],
        }),
      );
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const base = `http://127.0.0.1:${address.port}`;

  const previousKey = process.env.TAVILY_API_KEY;
  const previousBase = process.env.TAVILY_BASE_URL;
  process.env.TAVILY_API_KEY = "test-tavily";
  process.env.TAVILY_BASE_URL = base;

  try {
    const response = await searchWeb("onboarding drop-off", { count: 3 });

    assert.equal(response.provider, "tavily");
    assert.equal(response.query, "onboarding drop-off");
    assert.equal(response.results.length, 1);
    assert.deepEqual(response.results[0], {
      title: "Spaced title",
      url: "https://example.com/a",
      snippet: "snippet text",
      publishedDate: "2024-05-01",
    });
    assert.equal(received.url, "/search");
    assert.equal(received.auth, "Bearer test-tavily");
    assert.match(received.body ?? "", /onboarding drop-off/);
  } finally {
    server.close();
    if (previousKey === undefined) delete process.env.TAVILY_API_KEY;
    else process.env.TAVILY_API_KEY = previousKey;
    if (previousBase === undefined) delete process.env.TAVILY_BASE_URL;
    else process.env.TAVILY_BASE_URL = previousBase;
  }
});

test("searchWeb surfaces a provider error instead of returning empty results", async () => {
  const { createServer } = await import("node:http");
  const server = createServer((_request, response) => {
    response.writeHead(401, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ detail: "Invalid API key" }));
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  const previousKey = process.env.TAVILY_API_KEY;
  const previousBase = process.env.TAVILY_BASE_URL;
  process.env.TAVILY_API_KEY = "bad";
  process.env.TAVILY_BASE_URL = `http://127.0.0.1:${address.port}`;

  try {
    await assert.rejects(
      () => searchWeb("anything"),
      (error: unknown) =>
        error instanceof ResearchRequestError &&
        error.status === 401 &&
        /Invalid API key/.test(error.message),
    );
  } finally {
    server.close();
    if (previousKey === undefined) delete process.env.TAVILY_API_KEY;
    else process.env.TAVILY_API_KEY = previousKey;
    if (previousBase === undefined) delete process.env.TAVILY_BASE_URL;
    else process.env.TAVILY_BASE_URL = previousBase;
  }
});

test("searchWeb reaches Brave through the same shape", async () => {
  const { createServer } = await import("node:http");
  const seen: { url?: string; token?: string } = {};
  const server = createServer((request, response) => {
    seen.url = request.url;
    seen.token = request.headers["x-subscription-token"] as string | undefined;
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        web: {
          results: [
            {
              title: "Brave result",
              url: "https://example.org/x",
              description: "<b>bold</b> snippet",
              page_age: "2024-02-02",
            },
          ],
        },
      }),
    );
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  const previous = {
    tavily: process.env.TAVILY_API_KEY,
    brave: process.env.BRAVE_SEARCH_API_KEY,
    braveBase: process.env.BRAVE_SEARCH_BASE_URL,
  };
  delete process.env.TAVILY_API_KEY;
  process.env.BRAVE_SEARCH_API_KEY = "test-brave";
  process.env.BRAVE_SEARCH_BASE_URL = `http://127.0.0.1:${address.port}`;

  try {
    const response = await searchWeb("query", { count: 2 });
    assert.equal(response.provider, "brave");
    assert.equal(response.results.length, 1);
    // HTML in the provider's description is stripped so it cannot break layout.
    assert.equal(response.results[0]!.snippet, "bold snippet");
    assert.equal(response.results[0]!.publishedDate, "2024-02-02");
    assert.match(seen.url ?? "", /\/web\/search\?/);
    assert.equal(seen.token, "test-brave");
  } finally {
    server.close();
    if (previous.tavily === undefined) delete process.env.TAVILY_API_KEY;
    else process.env.TAVILY_API_KEY = previous.tavily;
    if (previous.brave === undefined) delete process.env.BRAVE_SEARCH_API_KEY;
    else process.env.BRAVE_SEARCH_API_KEY = previous.brave;
    if (previous.braveBase === undefined) delete process.env.BRAVE_SEARCH_BASE_URL;
    else process.env.BRAVE_SEARCH_BASE_URL = previous.braveBase;
  }
});

test("the search route returns real results end to end", async () => {
  const { createServer } = await import("node:http");
  const server = createServer((_request, response) => {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        results: [
          { title: "One", url: "https://one.example", content: "first" },
          { title: "Two", url: "https://two.example", content: "second" },
        ],
      }),
    );
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  const previousKey = process.env.TAVILY_API_KEY;
  const previousBase = process.env.TAVILY_BASE_URL;
  process.env.TAVILY_API_KEY = "test-tavily";
  process.env.TAVILY_BASE_URL = `http://127.0.0.1:${address.port}`;

  try {
    const response = await searchRoute(
      jsonRequest("http://test/api/research/search", { query: "anything", count: 5 }),
    );
    assert.equal(response.status, 200);
    const payload = (await response.json()) as {
      provider: string;
      results: Array<{ title: string }>;
    };
    assert.equal(payload.provider, "tavily");
    assert.deepEqual(
      payload.results.map((result) => result.title),
      ["One", "Two"],
    );
  } finally {
    server.close();
    if (previousKey === undefined) delete process.env.TAVILY_API_KEY;
    else process.env.TAVILY_API_KEY = previousKey;
    if (previousBase === undefined) delete process.env.TAVILY_BASE_URL;
    else process.env.TAVILY_BASE_URL = previousBase;
  }
});

test("the summarise route runs against a real model endpoint", async () => {
  const { createServer } = await import("node:http");
  let sawSystem = "";
  let sawUser = "";
  const server = createServer((request, response) => {
    let body = "";
    request.on("data", (chunk) => (body += chunk));
    request.on("end", () => {
      const parsed = JSON.parse(body) as {
        messages: Array<{ role: string; content: string }>;
      };
      sawSystem = parsed.messages.find((message) => message.role === "system")?.content ?? "";
      sawUser = parsed.messages.find((message) => message.role === "user")?.content ?? "";
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({
          choices: [
            {
              message: {
                content: "Drop-off is driven by friction [1]. A second cause is latency [2].",
              },
            },
          ],
          usage: { prompt_tokens: 100, completion_tokens: 50 },
        }),
      );
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");

  const previous = {
    key: process.env.OPENAI_API_KEY,
    base: process.env.OPENAI_BASE_URL,
  };
  process.env.OPENAI_API_KEY = "test-key";
  process.env.OPENAI_BASE_URL = `http://127.0.0.1:${address.port}`;

  try {
    const response = await summarizeRoute(
      jsonRequest("http://test/api/research/summarize", {
        question: "What causes onboarding drop-off?",
        results: [
          { title: "First", url: "https://a.example", snippet: "friction", publishedDate: null },
          { title: "Second", url: "https://b.example", snippet: "latency", publishedDate: null },
          { title: "Third", url: "https://c.example", snippet: "unused", publishedDate: null },
        ],
      }),
    );

    assert.equal(response.status, 200);
    const payload = (await response.json()) as {
      summary: string;
      citedSources: number[];
      sources: Array<{ index: number }>;
    };
    assert.deepEqual(payload.citedSources, [1, 2]);
    assert.equal(payload.sources.length, 3);
    // The model really received the numbered sources and the question.
    assert.match(sawUser, /\[1\] First/);
    assert.match(sawUser, /What causes onboarding drop-off\?/);
    assert.match(sawSystem, /Do not add facts/i);
  } finally {
    server.close();
    if (previous.key === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = previous.key;
    if (previous.base === undefined) delete process.env.OPENAI_BASE_URL;
    else process.env.OPENAI_BASE_URL = previous.base;
  }
});

test("sourceLabel returns the host without www", () => {
  assert.equal(sourceLabel("https://www.example.com/a/b?c=1"), "example.com");
  assert.equal(sourceLabel("https://blog.example.co.uk/post"), "blog.example.co.uk");
  // A value that is not a URL is shown as-is rather than hidden.
  assert.equal(sourceLabel("not a url"), "not a url");
});

test("buildSummarisePrompt numbers sources and forbids invention", () => {
  const prompt = buildSummarisePrompt({
    question: "What causes onboarding drop-off?",
    results: [
      { title: "First", url: "https://a.example/1", snippet: "A snippet", publishedDate: null },
      { title: "Second", url: "https://b.example/2", snippet: "", publishedDate: "2024-01-01" },
    ],
  });

  assert.match(prompt.user, /What causes onboarding drop-off\?/);
  assert.match(prompt.user, /\[1\] First/);
  assert.match(prompt.user, /\[2\] Second/);
  // A result with no excerpt must be labelled, not silently blank.
  assert.match(prompt.user, /no excerpt/);
  assert.match(prompt.system, /Do not add facts/i);
  assert.match(prompt.system, /square brackets/);
});

test("parseCitations returns only real, de-duplicated source numbers", () => {
  const summary = "Claim one [1]. Claim two [2][1]. Bogus [9]. Also [0] and [3].";
  assert.deepEqual(parseCitations(summary, 3), [1, 2, 3]);
  assert.deepEqual(parseCitations("no citations here", 3), []);
  assert.deepEqual(parseCitations("[1] and [1] again", 3), [1]);
});

test("indexSources numbers from one so the prompt and UI agree", () => {
  const indexed = indexSources([
    { title: "A", url: "https://a.example", snippet: "", publishedDate: null },
    { title: "B", url: "https://b.example", snippet: "", publishedDate: null },
  ]);
  assert.deepEqual(
    indexed.map((source) => source.index),
    [1, 2],
  );
});

test("the search route reports 503 when unconfigured", async () => {
  const previous = process.env.TAVILY_API_KEY;
  const previousBrave = process.env.BRAVE_SEARCH_API_KEY;
  clearProviderKeys();

  const response = await searchRoute(
    jsonRequest("http://test/api/research/search", { query: "anything" }),
  );
  assert.equal(response.status, 503);
  const payload = (await response.json()) as { error: string };
  assert.match(payload.error, /TAVILY_API_KEY/);

  if (previous !== undefined) process.env.TAVILY_API_KEY = previous;
  if (previousBrave !== undefined) process.env.BRAVE_SEARCH_API_KEY = previousBrave;
});

test("the search route validates its body once configured", async () => {
  const previous = process.env.TAVILY_API_KEY;
  process.env.TAVILY_API_KEY = "test-tavily";

  const empty = await searchRoute(
    jsonRequest("http://test/api/research/search", { query: "  " }),
  );
  assert.equal(empty.status, 400);
  const payload = (await empty.json()) as { error: string };
  assert.match(payload.error, /search for/);

  const malformed = await searchRoute(
    new Request("http://test/api/research/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ not json",
    }),
  );
  assert.equal(malformed.status, 400);

  const tooLong = await searchRoute(
    jsonRequest("http://test/api/research/search", { query: "a".repeat(500) }),
  );
  assert.equal(tooLong.status, 400);

  if (previous === undefined) delete process.env.TAVILY_API_KEY;
  else process.env.TAVILY_API_KEY = previous;
});

test("the summarise route requires a model key", async () => {
  const previous = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  const response = await summarizeRoute(
    jsonRequest("http://test/api/research/summarize", {
      question: "q",
      results: [{ title: "t", url: "https://example.com", snippet: "", publishedDate: null }],
    }),
  );
  assert.equal(response.status, 503);
  const payload = (await response.json()) as { error: string };
  assert.match(payload.error, /OPENAI_API_KEY/);

  if (previous !== undefined) process.env.OPENAI_API_KEY = previous;
});

test("the summarise route validates sources before calling the model", async () => {
  const previous = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = "test-key-not-used";

  const noQuestion = await summarizeRoute(
    jsonRequest("http://test/api/research/summarize", {
      results: [{ title: "t", url: "https://example.com" }],
    }),
  );
  assert.equal(noQuestion.status, 400);

  const noSources = await summarizeRoute(
    jsonRequest("http://test/api/research/summarize", { question: "q", results: [] }),
  );
  assert.equal(noSources.status, 400);

  // Sources without a usable URL cannot be cited, so they are rejected rather
  // than summarised from nothing.
  const badSources = await summarizeRoute(
    jsonRequest("http://test/api/research/summarize", {
      question: "q",
      results: [{ title: "no url", snippet: "x" }],
    }),
  );
  assert.equal(badSources.status, 400);
  const payload = (await badSources.json()) as { error: string };
  assert.match(payload.error, /usable URL/);

  if (previous === undefined) delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY = previous;
});
