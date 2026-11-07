import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { ResearchWorkspace } from "@/components/research/research-workspace";
import { isResearchConfigured } from "@/lib/research/search";

export const metadata: Metadata = {
  title: "Research Assistant",
  description: "Find sources and summarise findings.",
};

export const dynamic = "force-dynamic";

export default function ResearchPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Research Assistant"
        description="Search for sources, then summarise them with citations you can check."
      />
      <ResearchWorkspace configured={isResearchConfigured()} />
    </div>
  );
}
