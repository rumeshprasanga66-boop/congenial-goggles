import type { Metadata } from "next";
import { Brain } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = {
  title: "Brainstorm",
  description: "Generate and organise ideas.",
};

export default function BrainstormPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Brainstorm"
        description="Turn a starting point into ideas, headlines, outlines and content plans."
      />
      <ComingSoon
        icon={Brain}
        title="Brainstorming is not built yet"
        description="Idea generation needs the AI backend and a place to save results. When it ships, any idea can be sent straight into a new document."
        phase="Phase 4"
        requires={["The server-side brainstorm route and an AI provider API key"]}
      />
    </div>
  );
}
