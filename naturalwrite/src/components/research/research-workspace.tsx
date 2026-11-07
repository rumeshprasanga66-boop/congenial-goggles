"use client";

import * as React from "react";
import {
  ExternalLink,
  FileSearch,
  Info,
  Link2,
  Loader2,
  Quote,
  Search,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Label, Select } from "@/components/ui/form";
import type { SearchResult } from "@/lib/research/search";

interface Source extends SearchResult {
  index: number;
}

interface SummariseResponse {
  summary: string;
  citedSources: number[];
  sources: Source[];
  model: string;
}

type Phase = "idle" | "searching" | "summarising" | "done";

/**
 * Research assistant.
 *
 * The two halves are separate on purpose. Search returns whatever the provider
 * returned, with links the writer can open. Summarising is a second, explicit
 * step that shows which sources the model cited and names any source it
 * ignored. Nothing is invented to fill a gap: an empty result set renders an
 * empty state.
 */
export function ResearchWorkspace({ configured }: { configured: boolean }) {
  const [question, setQuestion] = React.useState("");
  const [count, setCount] = React.useState(5);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [sources, setSources] = React.useState<Source[]>([]);
  const [summary, setSummary] = React.useState<SummariseResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [searched, setSearched] = React.useState(false);

  async function runSearch() {
    setPhase("searching");
    setError(null);
    setSummary(null);
    try {
      const response = await fetch("/api/research/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: question, count }),
      });
      const payload = (await response.json()) as {
        results?: SearchResult[];
        error?: string;
      };
      if (!response.ok) {
        setError(payload.error ?? "The search could not be completed.");
        setSources([]);
        return;
      }
      const results = payload.results ?? [];
      setSources(results.map((result, index) => ({ ...result, index: index + 1 })));
    } catch {
      setError("The search could not be completed. Check your connection and try again.");
      setSources([]);
    } finally {
      setSearched(true);
      setPhase("idle");
    }
  }

  async function runSummarise() {
    if (sources.length === 0) return;
    setPhase("summarising");
    setError(null);
    try {
      const response = await fetch("/api/research/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          results: sources.map(({ title, url, snippet, publishedDate }) => ({
            title,
            url,
            snippet,
            publishedDate,
          })),
        }),
      });
      const payload = (await response.json()) as SummariseResponse & { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "The summary could not be generated.");
        return;
      }
      setSummary(payload);
    } catch {
      setError("The summary could not be generated. Check your connection and try again.");
    } finally {
      setPhase("done");
    }
  }

  const busy = phase === "searching" || phase === "summarising";
  const uncited = summary
    ? summary.sources.filter(
        (source) => !summary.citedSources.includes(source.index),
      )
    : [];

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_140px]">
            <div>
              <Label htmlFor="research-question">Question or phrase</Label>
              <Input
                id="research-question"
                className="mt-1.5"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && question.trim() && !busy) {
                    void runSearch();
                  }
                }}
                placeholder="e.g. What does research say about onboarding drop-off?"
              />
            </div>
            <div>
              <Label htmlFor="research-count">Sources</Label>
              <Select
                id="research-count"
                className="mt-1.5"
                value={count}
                onChange={(event) => setCount(Number(event.target.value))}
              >
                {[3, 5, 8].map((value) => (
                  <option key={value} value={value}>
                    Up to {value}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={runSearch}
              disabled={busy || !question.trim() || !configured}
            >
              {phase === "searching" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              {phase === "searching" ? "Searching…" : "Search"}
            </Button>
            {sources.length > 0 ? (
              <Button
                variant="secondary"
                onClick={runSummarise}
                disabled={busy || !configured}
              >
                {phase === "summarising" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Quote className="size-4" />
                )}
                {phase === "summarising" ? "Summarising…" : "Summarise these sources"}
              </Button>
            ) : null}
          </div>
          {!configured ? (
            <p className="flex gap-2 rounded-control border border-caution/20 bg-caution/10 px-3 py-2.5 text-xs text-caution">
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
              No search provider is configured, so search is disabled. Set
              TAVILY_API_KEY or BRAVE_SEARCH_API_KEY on the server to enable it.
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="text-xs text-danger">
              {error}
            </p>
          ) : null}
        </CardBody>
      </Card>

      {sources.length > 0 ? (
        <Card>
          <CardHeader className="flex items-center justify-between gap-3">
            <CardTitle>Sources</CardTitle>
            <Badge tone="neutral">{sources.length}</Badge>
          </CardHeader>
          <CardBody className="space-y-2">
            {sources.map((source) => {
              const cited = summary?.citedSources.includes(source.index);
              return (
                <div
                  key={source.url}
                  className="rounded-control border border-line px-3 py-2.5"
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 text-2xs font-medium text-faint">
                      [{source.index}]
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-ink underline-offset-2 hover:text-brand hover:underline"
                        >
                          {source.title}
                          <ExternalLink className="ml-1 inline size-3 align-baseline" />
                        </a>
                        {summary ? (
                          <Badge tone={cited ? "positive" : "neutral"}>
                            {cited ? "cited" : "not cited"}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 text-2xs text-faint">
                        <Link2 className="size-3" />
                        {source.url}
                        {source.publishedDate ? ` · ${source.publishedDate}` : ""}
                      </p>
                      {source.snippet ? (
                        <p className="mt-1 text-xs text-muted">{source.snippet}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      ) : searched && !error ? (
        <EmptyState
          icon={<FileSearch className="size-5" />}
          title="No sources found"
          description="The search provider returned nothing for this query. Try different words rather than a broader claim: the assistant will not invent sources to fill the gap."
        />
      ) : null}

      {summary ? (
        <Card>
          <CardHeader className="flex items-center justify-between gap-3">
            <CardTitle>Summary</CardTitle>
            <Badge tone={summary.citedSources.length > 0 ? "brand" : "caution"}>
              {summary.citedSources.length} of {summary.sources.length} sources cited
            </Badge>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
              {summary.summary}
            </div>
            {summary.citedSources.length === 0 ? (
              <p className="flex gap-2 rounded-control border border-caution/20 bg-caution/10 px-3 py-2.5 text-xs text-caution">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                This summary cites no source. Treat it as a starting point and check
                it against the sources above before using it.
              </p>
            ) : null}
            {uncited.length > 0 ? (
              <p className="text-xs text-muted">
                Not drawn on: {uncited.map((source) => `[${source.index}]`).join(", ")}.
              </p>
            ) : null}
            <p className="flex gap-2 text-2xs text-muted">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Summaries are generated from the excerpts above and can be wrong. Open
              the source before repeating a claim. Model: {summary.model}.
            </p>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
