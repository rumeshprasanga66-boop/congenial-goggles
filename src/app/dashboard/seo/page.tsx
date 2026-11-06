import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = {
  title: "SEO Writer",
  description: "Write for search and readers.",
};

export default function SeoWriterPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO Writer"
        description="Plan headings, keywords and structure without sacrificing readability."
      />
      <ComingSoon
        icon={BarChart3}
        title="The SEO writer is not built yet"
        description="This tool will build on the writing studio, adding keyword targeting and structure guidance rather than replacing it."
        phase="Phase 5"
        requires={["The writing studio from Phase 2 to build on"]}
      />
    </div>
  );
}
