import type { Metadata } from "next";
import { PageHeader } from "@/components/app/page-header";
import { BrandVoiceManager } from "@/components/brand-voice/brand-voice-manager";
import { listBrandVoices } from "@/lib/brand-voice/store";

export const metadata: Metadata = {
  title: "Brand Voice",
  description: "Reusable guidance that shapes how your writing sounds.",
};

export const dynamic = "force-dynamic";

export default async function BrandVoicePage() {
  const voices = await listBrandVoices();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Brand Voice"
        description="Describe how your writing should sound once, then apply it everywhere."
      />
      <BrandVoiceManager voices={voices} />
    </div>
  );
}
