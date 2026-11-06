import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = {
  title: "Rewrite & Improve",
  description: "Polish text you already have.",
};

export default function RewriterPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Rewrite & Improve"
        description="Paste text, choose an improvement, and compare the revision side by side."
      />
      <ComingSoon
        icon={Sparkles}
        title="The rewrite workspace is not built yet"
        description="This will offer improvement actions, tone selection and a side-by-side comparison where you accept or reject the revision. Your original text is never overwritten automatically."
        phase="Phase 4"
        requires={["The server-side rewrite route and an AI provider API key"]}
      />
    </div>
  );
}
