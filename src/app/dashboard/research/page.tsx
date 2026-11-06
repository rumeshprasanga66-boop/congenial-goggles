import type { Metadata } from "next";
import { Search } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = {
  title: "Research Assistant",
  description: "Find sources and summarise findings.",
};

export default function ResearchPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Research Assistant"
        description="Gather source-backed findings and carry them into your writing."
      />
      <ComingSoon
        icon={Search}
        title="Live research is not available"
        description="Research requires a server-side search provider. Without one, the assistant cannot retrieve real sources, and it will never invent citations, quotations or findings to fill the gap."
        phase="Phase 5"
        requires={[
          "A search provider API key stored server-side (for example Tavily or Brave Search)",
          "The research route that calls the provider and preserves source links",
        ]}
      />
    </div>
  );
}
