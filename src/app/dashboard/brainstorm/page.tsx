import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { AiStatusNotice } from "@/components/studio/ai-status-notice";
import { BrainstormWorkspace } from "@/components/brainstorm/brainstorm-workspace";
import { listBrandVoices } from "@/lib/brand-voice/store";

export const metadata: Metadata = {
  title: "Brainstorm",
  description: "Generate and organise ideas.",
};

export const dynamic = "force-dynamic";

export default async function BrainstormPage() {
  const voices = await listBrandVoices();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brainstorm"
        description="Turn a starting point into ideas, headlines, outlines and content plans."
      />
      <AiStatusNotice />
      <BrainstormWorkspace
        brandVoices={voices.map((voice) => ({ id: voice.id, name: voice.name }))}
      />
    </div>
  );
}
