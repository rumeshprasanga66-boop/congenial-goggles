import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = {
  title: "Usage & Credits",
  description: "Track generations and spend.",
};

export default function UsagePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Usage & Credits"
        description="See how much you generate, on which model, and at what estimated cost."
      />
      <ComingSoon
        icon={BarChart3}
        title="Usage tracking is not connected yet"
        description="Every AI request will be logged with its model, token counts and estimated cost, and these charts will read from that log. No figures are shown until the log exists, because invented numbers would be misleading."
        phase="Phase 5"
        requires={["The usage_records table and token accounting in the AI routes"]}
      />
    </div>
  );
}
