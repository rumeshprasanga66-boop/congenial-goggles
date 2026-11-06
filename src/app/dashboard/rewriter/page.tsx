import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { AiStatusNotice } from "@/components/studio/ai-status-notice";
import { RewriteWorkspace } from "@/components/rewriter/rewrite-workspace";
import { listBrandVoices } from "@/lib/brand-voice/store";

export const metadata: Metadata = {
  title: "Rewrite & Improve",
  description: "Polish text you already have.",
};

export const dynamic = "force-dynamic";

export default async function RewriterPage() {
  const voices = await listBrandVoices();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rewrite & Improve"
        description="Paste text, choose an improvement, and compare the revision side by side."
      />
      <AiStatusNotice />
      <RewriteWorkspace
        brandVoices={voices.map((voice) => ({ id: voice.id, name: voice.name }))}
      />
    </div>
  );
}
