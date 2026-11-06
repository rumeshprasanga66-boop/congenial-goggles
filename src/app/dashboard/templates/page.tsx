import type { Metadata } from "next";
import { LayoutTemplate } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = {
  title: "Templates",
  description: "Start from a proven structure.",
};

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Template library"
        description="Proven structures for articles, emails, business documents and more."
      />
      <ComingSoon
        icon={LayoutTemplate}
        title="The template library is not built yet"
        description="Templates will be browsable by category and searchable, with a preview and a use template action that opens the writing studio pre-filled."
        phase="Phase 4"
        requires={["The templates table, or a bundled built-in set stored in the repository"]}
      />
    </div>
  );
}
