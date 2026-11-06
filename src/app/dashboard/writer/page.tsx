import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { AiStatusNotice } from "@/components/studio/ai-status-notice";
import { WritingStudio } from "@/components/studio/writing-studio";

export const metadata: Metadata = {
  title: "AI Writing Studio",
  description:
    "Describe what you want to write, review the outline, then draft and edit it section by section.",
};

export default function WriterPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Writing Studio"
        description="Describe the piece, review the outline, then draft and edit it section by section."
      />
      <AiStatusNotice />
      <WritingStudio />
    </div>
  );
}
