import type { Metadata } from "next";
import { PenLine } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = {
  title: "AI Writer",
  description: "Draft structured content with AI guidance.",
};

export default function WriterPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Writing Studio"
        description="Describe what you want to write and NaturalWrite drafts it in editable sections."
      />
      <ComingSoon
        icon={PenLine}
        title="The writing studio is not built yet"
        description="This page will hold the brief form (topic, audience, tone, length), the section-by-section generation workflow and the rich text editor. Nothing here is a working generator today, so no controls are shown that pretend otherwise."
        phase="Phase 2"
        requires={[
          "An AI provider API key stored as a server-side environment variable",
          "The server-side generation routes that the studio calls",
        ]}
      />
    </div>
  );
}
