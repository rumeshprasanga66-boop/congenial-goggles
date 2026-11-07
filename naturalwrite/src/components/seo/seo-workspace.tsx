"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Gauge,
  Info,
  ListTree,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/form";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import type { SeoCheck, SeoReport } from "@/lib/seo/analyse";
import { countProseWords, scoreBand } from "@/lib/seo/analyse";
import { planSeo, type SeoPlan } from "@/lib/seo/plan";

const CHECK_ICON: Record<SeoCheck["status"], React.ElementType> = {
  pass: CheckCircle2,
  warn: AlertTriangle,
  fail: XCircle,
};

const CHECK_TONE: Record<SeoCheck["status"], string> = {
  pass: "text-positive",
  warn: "text-caution",
  fail: "text-danger",
};

/**
 * The SEO writer.
 *
 * The report is computed from the draft, so it updates as the writer types and
 * works without any provider key. The plan suggests a structure derived from the
 * keyword; it is a starting point the writer can ignore, not a demand.
 */
export function SeoWorkspace() {
  const [topic, setTopic] = React.useState("");
  const [keyword, setKeyword] = React.useState("");
  const [secondary, setSecondary] = React.useState("");
  const [draft, setDraft] = React.useState("");
  const [length, setLength] = React.useState<"short" | "medium" | "long" | "custom">("medium");
  const [report, setReport] = React.useState<SeoReport | null>(null);
  const [plan, setPlan] = React.useState<SeoPlan | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  // The same measure the analyser uses, so the header count and the report
  // never disagree.
  const wordCount = React.useMemo(() => countProseWords(draft), [draft]);

  async function runAnalysis() {
    setBusy(true);
    setError(null);
    try {
      const secondaryKeywords = secondary
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);

      const response = await fetch("/api/seo/analyse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft, keyword, secondaryKeywords }),
      });
      const payload = (await response.json()) as { report?: SeoReport; error?: string };
      if (!response.ok || !payload.report) {
        setError(payload.error ?? "The analysis could not be completed.");
        setReport(null);
        return;
      }
      setReport(payload.report);
      setPlan(
        planSeo({
          topic,
          keyword,
          contentType: "blog_post",
          tone: "natural",
          length,
          draft,
        }),
      );
    } catch {
      setError("The analysis could not be completed. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const band = report ? scoreBand(report.score) : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Targeting</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="seo-topic">Subject</Label>
            <Input
              id="seo-topic"
              className="mt-1.5"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="e.g. Reducing onboarding drop-off in team software"
            />
          </div>
          <div>
            <Label htmlFor="seo-keyword">Primary keyword</Label>
            <Input
              id="seo-keyword"
              className="mt-1.5"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="e.g. onboarding drop-off"
            />
            <p className="mt-1 text-xs text-muted">
              The phrase you want the piece to rank for. Leave it empty to check
              length and structure only.
            </p>
          </div>
          <div>
            <Label htmlFor="seo-secondary">Secondary phrases</Label>
            <Input
              id="seo-secondary"
              className="mt-1.5"
              value={secondary}
              onChange={(event) => setSecondary(event.target.value)}
              placeholder="onboarding checklist, activation rate"
            />
            <p className="mt-1 text-xs text-muted">Comma separated. Up to 20.</p>
          </div>
          <div>
            <Label htmlFor="seo-length">Intended length</Label>
            <Select
              id="seo-length"
              className="mt-1.5"
              value={length}
              onChange={(event) =>
                setLength(event.target.value as typeof length)
              }
            >
              <option value="short">Short — about 500 words</option>
              <option value="medium">Medium — about 1,100 words</option>
              <option value="long">Long — about 2,000 words</option>
            </Select>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between gap-3">
          <CardTitle>Draft</CardTitle>
          <span className="text-xs text-muted">
            {formatNumber(wordCount)} words
          </span>
        </CardHeader>
        <CardBody className="space-y-3">
          <Textarea
            aria-label="Draft"
            className="min-h-[260px] font-mono text-xs"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={"# Your heading\n\nWrite or paste your draft here. Markdown headings (## Section) are read as structure."}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={runAnalysis} disabled={busy || !draft.trim()}>
              <Gauge className="size-4" />
              {busy ? "Analysing…" : "Analyse draft"}
            </Button>
            <p className="text-xs text-muted">
              Analysis is computed from the text. It is not a ranking prediction.
            </p>
          </div>
          {error ? (
            <p role="alert" className="text-xs text-danger">
              {error}
            </p>
          ) : null}
        </CardBody>
      </Card>

      {report ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex items-center justify-between gap-3">
                <CardTitle>Checks</CardTitle>
                <Badge
                  tone={
                    band === "good" ? "positive" : band === "fair" ? "caution" : "danger"
                  }
                >
                  {report.score}/100
                </Badge>
              </CardHeader>
              <CardBody className="space-y-3">
                {report.checks.map((check) => {
                  const Icon = CHECK_ICON[check.status];
                  return (
                    <div
                      key={check.id}
                      className="flex gap-3 rounded-control border border-line bg-subtle/60 px-3 py-2.5"
                    >
                      <Icon className={cn("mt-0.5 size-4 shrink-0", CHECK_TONE[check.status])} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">{check.label}</p>
                        <p className="text-xs text-muted">{check.detail}</p>
                        {check.advice ? (
                          <p className="mt-1 text-xs text-ink">{check.advice}</p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </CardBody>
            </Card>

            {report.secondaryCoverage.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Secondary phrases</CardTitle>
                </CardHeader>
                <CardBody className="flex flex-wrap gap-2">
                  {report.secondaryCoverage.map((entry) => (
                    <Badge
                      key={entry.keyword}
                      tone={entry.present ? "positive" : "neutral"}
                    >
                      {entry.present ? <CheckCircle2 className="size-3" /> : <CircleDashed className="size-3" />}
                      {entry.keyword} · {entry.count}
                    </Badge>
                  ))}
                </CardBody>
              </Card>
            ) : null}

            {plan && plan.sections.length > 0 ? (
              <Card>
                <CardHeader className="flex items-center gap-2">
                  <ListTree className="size-4 text-muted" />
                  <CardTitle>Suggested structure</CardTitle>
                </CardHeader>
                <CardBody className="space-y-2">
                  <p className="text-xs text-muted">
                    Derived from your keyword, scaled to about{" "}
                    {formatNumber(
                      plan.sections.reduce((sum, section) => sum + section.wordTarget, 0),
                    )}{" "}
                    words. Ignore any section that does not fit.
                  </p>
                  {plan.sections.map((section) => (
                    <div
                      key={section.title}
                      className="rounded-control border border-line px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-ink">{section.title}</p>
                        <span className="shrink-0 text-2xs text-muted">
                          ~{section.wordTarget}w
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted">{section.rationale}</p>
                    </div>
                  ))}
                </CardBody>
              </Card>
            ) : null}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="flex items-center gap-2">
                <Sparkles className="size-4 text-muted" />
                <CardTitle>At a glance</CardTitle>
              </CardHeader>
              <CardBody className="space-y-3 text-sm">
                <Stat label="Words" value={formatNumber(report.wordCount)} />
                <Stat
                  label="Reading time"
                  value={`${report.readingTimeMinutes} min`}
                />
                <Stat label="Headings" value={String(report.headings.length)} />
                {report.keyword ? (
                  <>
                    <Stat
                      label="Keyword uses"
                      value={`${report.keywordCount} (${report.keywordDensity}%)`}
                    />
                    <Stat
                      label="In title"
                      value={report.keywordInTitle ? "Yes" : "No"}
                    />
                    <Stat
                      label="In opening"
                      value={report.keywordInFirstParagraph ? "Yes" : "No"}
                    />
                  </>
                ) : null}
              </CardBody>
            </Card>

            {report.headings.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Outline</CardTitle>
                </CardHeader>
                <CardBody className="space-y-1">
                  {report.headings.map((heading, index) => (
                    <p
                      key={`${heading.level}-${index}`}
                      className="truncate text-xs text-muted"
                      style={{ paddingLeft: `${(heading.level - 1) * 12}px` }}
                    >
                      <span className="text-faint">h{heading.level}</span> {heading.text}
                    </p>
                  ))}
                  {report.headingOrderIssues.length > 0 ? (
                    <div className="mt-2 rounded-control border border-caution/20 bg-caution/10 px-3 py-2">
                      <p className="flex items-center gap-1.5 text-xs text-caution">
                        <AlertTriangle className="size-3.5" />
                        Heading levels skip a step
                      </p>
                      {report.headingOrderIssues.map((issue) => (
                        <p key={issue} className="mt-1 text-2xs text-muted">
                          {issue}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </CardBody>
              </Card>
            ) : null}

            <p className="flex gap-2 text-2xs text-muted">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              A high score here means the text satisfies these checks. It does not
              mean a search engine will rank it.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-muted">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
