import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = {
  title: "My Documents",
  description: "Every document in your workspace.",
};

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Documents"
        description="Search, filter and organise everything you have written."
      />
      <ComingSoon
        icon={FileText}
        title="Document storage is not connected yet"
        description="The library needs a database behind it. Until storage ships, this page cannot list documents, so it shows this notice instead of an empty table that looks broken."
        phase="Phase 3"
        requires={[
          "A Supabase project with the documents table and row level security",
          "Supabase URL and anon key in .env.local",
        ]}
      />
    </div>
  );
}
