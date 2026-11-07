import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, LayoutTemplate } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { TemplateFilters } from "@/components/templates/template-filters";
import {
  BUILTIN_TEMPLATES,
  TEMPLATE_CATEGORIES,
  type BuiltinTemplate,
} from "@/lib/templates/builtin";
import { getContentType, getTone, LENGTHS } from "@/lib/ai/options";

export const metadata: Metadata = {
  title: "Templates",
  description: "Start from a proven structure.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function single(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function matches(template: BuiltinTemplate, term: string): boolean {
  if (!term) return true;
  const haystack = [
    template.title,
    template.description,
    template.category,
    template.guidance,
    template.topicPrompt,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(term.toLowerCase());
}

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const term = single(params.q).trim();
  const category = single(params.category);

  const visible = BUILTIN_TEMPLATES.filter(
    (template) =>
      (category === "" || category === "all" || template.category === category) &&
      matches(template, term),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Template library"
        description="Proven structures for articles, emails, business documents and more."
      />

      <Suspense fallback={<div className="h-24" />}>
        <TemplateFilters categories={TEMPLATE_CATEGORIES} />
      </Suspense>

      {visible.length === 0 ? (
        <Card>
          <EmptyState
            icon={<LayoutTemplate className="size-5" aria-hidden="true" />}
            title="No templates match that search"
            description="Try a different word, or clear the filters to see the whole library."
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((template) => (
            <Card key={template.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-ink">{template.title}</h2>
                  <p className="mt-0.5 text-2xs font-medium uppercase tracking-wide text-faint">
                    {template.category}
                  </p>
                </div>
              </div>

              <p className="mt-2 flex-1 text-xs leading-relaxed text-muted">
                {template.description}
              </p>

              <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-2xs text-faint">
                <div className="flex gap-1">
                  <dt>Type</dt>
                  <dd className="text-muted">{getContentType(template.contentType).label}</dd>
                </div>
                <div className="flex gap-1">
                  <dt>Tone</dt>
                  <dd className="text-muted">{getTone(template.tone).label}</dd>
                </div>
                <div className="flex gap-1">
                  <dt>Length</dt>
                  <dd className="text-muted">
                    {LENGTHS.find((entry) => entry.id === template.length)?.label ??
                      template.length}
                  </dd>
                </div>
              </dl>

              <Link
                href={`/dashboard/writer?template=${template.id}`}
                className="mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-control bg-brand px-3 text-xs font-medium text-white shadow-sm transition-colors hover:bg-brand-ink"
              >
                Use template
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-muted">
        Templates prefill the brief. The topic prompt is a starting point you
        should replace with your own subject before generating.
      </p>
    </div>
  );
}
