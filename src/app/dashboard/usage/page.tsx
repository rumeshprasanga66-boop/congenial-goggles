import type { Metadata } from "next";
import Link from "next/link";
import { Activity, Info } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardBody, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { listUsageRecords, USAGE_IS_DURABLE } from "@/lib/data";
import { summarizeUsage } from "@/lib/usage";
import { formatNumber, formatRelativeTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Usage & Credits",
  description: "Real generation counts, token totals and estimated cost.",
};

export const dynamic = "force-dynamic";

function usd(value: number): string {
  return `$${value.toFixed(value < 0.01 ? 5 : 2)}`;
}

export default async function UsagePage() {
  const records = await listUsageRecords();
  const summary = summarizeUsage(records);

  const stats: Array<{ label: string; value: string; hint?: string }> = [
    { label: "Requests", value: formatNumber(summary.requests) },
    { label: "Input tokens", value: formatNumber(summary.inputTokens) },
    { label: "Output tokens", value: formatNumber(summary.outputTokens) },
    {
      label: "Estimated cost",
      value: summary.estimatedCost === null ? "Not configured" : usd(summary.estimatedCost),
      hint:
        summary.estimatedCost === null
          ? "Set MODEL_PRICING_JSON to estimate cost"
          : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usage & Credits"
        description="Every generation request this server has handled, with its real token counts."
      />

      {!USAGE_IS_DURABLE && (
        <div className="flex items-start gap-2.5 rounded-card border border-caution/25 bg-caution/5 px-4 py-3">
          <Info className="mt-0.5 size-4 shrink-0 text-caution" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-ink">
            <span className="font-medium">This log is not permanent.</span>{" "}
            <span className="text-muted">
              Records are held in memory and reset when the server restarts. Durable
              history, per-account limits and credit balances arrive with the usage
              table, so no allowance or quota is enforced yet.
            </span>
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardBody>
              <p className="text-2xs font-medium uppercase tracking-wider text-faint">
                {stat.label}
              </p>
              <p className="mt-1.5 text-2xl font-semibold tracking-tight text-ink">
                {stat.value}
              </p>
              {stat.hint && <p className="mt-1 text-2xs text-muted">{stat.hint}</p>}
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle as="h2">Recent requests</CardTitle>
            <CardDescription>
              Newest first. Each row is one call to the AI provider.
            </CardDescription>
          </div>
        </CardHeader>

        {records.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={<Activity className="size-5" aria-hidden="true" />}
              title="No generations yet"
              description="Generate a draft in the writing studio and the request will appear here with its token counts."
              action={
                <Link
                  href="/dashboard/writer"
                  className="text-xs font-medium text-brand-ink underline-offset-2 hover:underline"
                >
                  Open the writing studio
                </Link>
              }
            />
          </CardBody>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line text-2xs uppercase tracking-wider text-faint">
                <tr>
                  <th scope="col" className="px-5 py-2.5 font-medium">Operation</th>
                  <th scope="col" className="px-5 py-2.5 font-medium">Model</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">In</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Out</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Cost</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b border-line/60 last:border-0">
                    <td className="px-5 py-2.5">
                      <Badge tone="neutral">{record.operation}</Badge>
                    </td>
                    <td className="px-5 py-2.5 text-muted">{record.model}</td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-ink">
                      {formatNumber(record.inputTokens)}
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-ink">
                      {formatNumber(record.outputTokens)}
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-muted">
                      {record.estimatedCost > 0 ? usd(record.estimatedCost) : "—"}
                    </td>
                    <td className="px-5 py-2.5 text-right text-muted">
                      {formatRelativeTime(record.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
