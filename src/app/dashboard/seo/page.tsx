import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { SeoWorkspace } from "@/components/seo/seo-workspace";

export const metadata: Metadata = {
  title: "SEO Writer",
  description: "Write for search and readers.",
};

export default function SeoWriterPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="SEO Writer"
        description="Check structure and keyword use as you draft, then plan the sections you still need."
      />
      <SeoWorkspace />
    </div>
  );
}
