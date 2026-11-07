import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { AiStatusNotice } from "@/components/studio/ai-status-notice";
import { WritingStudio } from "@/components/studio/writing-studio";
import { EMPTY_BRIEF, briefFromTemplate } from "@/components/studio/types";
import { listBrandVoices } from "@/lib/brand-voice/store";
import { getBuiltinTemplate } from "@/lib/templates/builtin";

export const metadata: Metadata = {
  title: "AI Writing Studio",
  description:
    "Describe what you want to write, review the outline, then draft and edit it section by section.",
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function WriterPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const templateId = Array.isArray(params.template) ? params.template[0] : params.template;
  const template = templateId ? getBuiltinTemplate(templateId) : null;

  const topicParam = Array.isArray(params.topic) ? params.topic[0] : params.topic;

  let initialBrief = template ? briefFromTemplate(EMPTY_BRIEF, template) : EMPTY_BRIEF;
  if (topicParam?.trim()) {
    initialBrief = { ...initialBrief, topic: topicParam.trim().slice(0, 500) };
  }

  const voices = await listBrandVoices();
  const brandVoices = voices.map((voice) => ({ id: voice.id, name: voice.name }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Writing Studio"
        description="Describe the piece, review the outline, then draft and edit it section by section."
      />
      {template && (
        <div className="rounded-card border border-brand/20 bg-brand/5 px-4 py-3">
          <p className="text-xs text-muted">
            <span className="font-medium text-ink">{template.title}</span> template applied.
            Replace the topic with your own subject, then plan the outline.
          </p>
        </div>
      )}
      <AiStatusNotice />
      <WritingStudio initialBrief={initialBrief} brandVoices={brandVoices} />
    </div>
  );
}
