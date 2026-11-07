import Link from "next/link";
import {
  Coins,
  FileText,
  Info,
  Plus,
  Sparkles,
  Type,
} from "lucide-react";
import { ActionNeeded, ActionNeededHeader } from "@/components/app/action-needed";
import { MetricCard } from "@/components/app/metric-card";
import { QuickActions } from "@/components/app/quick-actions";
import { RecentDocuments } from "@/components/app/recent-documents";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { DEMO_MODE, getWorkspaceOverview } from "@/lib/data";
import { formatLongDate, formatNumber, greeting } from "@/lib/format";

function ConnectionNotice() {
  if (!DEMO_MODE) return null;
  return (
    <div className="flex flex-col gap-2 rounded-card border border-caution/20 bg-caution/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-2.5">
        <Info className="mt-0.5 size-3.5 shrink-0 text-caution" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-muted">
          <span className="font-medium text-ink">Documents are stored on this server.</span>{" "}
          Saving works, but there are no accounts yet, so every visitor to this
          deployment shares the same library. Sign-in and per-user isolation need
          Supabase credentials in{" "}
          <code className="font-mono text-2xs">.env.local</code>.
        </p>
      </div>
      <span className="shrink-0 text-2xs font-medium text-caution">Phase 5</span>
    </div>
  );
}

export default async function DashboardOverviewPage() {
  const { metrics, recentDocuments, notifications } =
    await getWorkspaceOverview();

  const today = new Date();

  return (
    <div className="space-y-6">
      <ConnectionNotice />

      <section className="rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted">
              {formatLongDate(today)}
            </p>
            <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">
              {greeting(today)}. What would you like to create today?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Your ideas, your workspace, your writing.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              href="/dashboard/writer"
              className="inline-flex h-10 items-center gap-2 rounded-control bg-brand px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-ink"
            >
              <Plus className="size-4" aria-hidden="true" />
              New document
            </Link>
            <Link
              href="/dashboard/templates"
              className="inline-flex h-10 items-center gap-2 rounded-control border border-line bg-surface px-4 text-sm font-medium text-ink shadow-sm transition-colors hover:bg-subtle"
            >
              Browse templates
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="overview-metrics">
        <h2 id="overview-metrics" className="sr-only">
          Overview metrics
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard
            label="Total documents"
            value={formatNumber(metrics.totalDocuments)}
            hint="Saved in your workspace"
            icon={FileText}
          />
          <MetricCard
            label="Words written"
            value={formatNumber(metrics.wordsWritten)}
            hint="Across all documents"
            icon={Type}
          />
          <MetricCard
            label="AI generations"
            value={formatNumber(metrics.aiGenerations)}
            hint="Recorded from usage log"
            icon={Sparkles}
          />
          <MetricCard
            label="Available credits"
            value={
              metrics.availableCredits === null
                ? "—"
                : formatNumber(metrics.availableCredits)
            }
            hint="Credit balances arrive with billing"
            icon={Coins}
          />
        </div>
      </section>

      <section aria-labelledby="quick-actions">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="quick-actions" className="text-sm font-semibold text-ink">
            Quick actions
          </h2>
        </div>
        <QuickActions />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden">
          <CardHeader>
            <div>
              <CardTitle>Recent documents</CardTitle>
              <p className="mt-0.5 text-xs text-muted">
                Your most recently edited work.
              </p>
            </div>
            <Link
              href="/dashboard/documents"
              className="shrink-0 text-2xs font-medium text-brand hover:text-brand-ink"
            >
              View all
            </Link>
          </CardHeader>
          <CardBody className="p-0">
            <RecentDocuments documents={recentDocuments} />
          </CardBody>
        </Card>

        <section
          id="action-needed"
          aria-labelledby="action-needed-heading"
          className="space-y-3"
        >
          <h2 id="action-needed-heading" className="sr-only">
            Action needed
          </h2>
          <ActionNeededHeader />
          <ActionNeeded notifications={notifications} />
        </section>
      </div>
    </div>
  );
}
