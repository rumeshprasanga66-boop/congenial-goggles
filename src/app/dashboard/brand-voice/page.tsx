import type { Metadata } from "next";
import { Users } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = {
  title: "Brand Voice",
  description: "Reusable writing preferences.",
};

export default function BrandVoicePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Brand Voice"
        description="Save tone, audience, vocabulary and sample text so drafts sound like you."
      />
      <ComingSoon
        icon={Users}
        title="Brand voice profiles are not built yet"
        description="Profiles will be saved per user and applied when generating or rewriting. They guide the writing; they do not promise perfect imitation of any author."
        phase="Phase 4"
        requires={["The brand_voices table with row level security"]}
      />
    </div>
  );
}
