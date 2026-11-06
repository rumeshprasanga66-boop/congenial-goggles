import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = {
  title: "Settings",
  description: "Profile, defaults and security.",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your profile, writing defaults and account security."
      />
      <ComingSoon
        icon={Settings}
        title="Account settings are not built yet"
        description="Profile editing, default tone and language, notification preferences and account deletion all depend on authentication. They arrive with the rest of the account features."
        phase="Phase 5"
        requires={[
          "Supabase Auth configured for the project",
          "The profiles table with row level security",
        ]}
      />

      <section id="help" aria-labelledby="help-heading" className="scroll-mt-20">
        <h2 id="help-heading" className="sr-only">
          Help and support
        </h2>
        <div className="rounded-card border border-line bg-surface p-5 shadow-card">
          <h3 className="text-sm font-semibold text-ink">Help &amp; support</h3>
          <p className="mt-1.5 max-w-2xl text-sm text-muted">
            Support channels and documentation links will be listed here. No
            contact form is shown yet because there is nothing behind it to
            receive messages.
          </p>
        </div>
      </section>
    </div>
  );
}
