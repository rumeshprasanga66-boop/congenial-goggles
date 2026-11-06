import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/marketing/section";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How NaturalWrite handles your data.",
};

export default function PrivacyPage() {
  return (
    <Section className="py-16 sm:py-20">
      <SectionHeading
        align="left"
        eyebrow="Legal"
        title="Privacy policy"
        description="This is a plain-language summary. It will be replaced by a complete, reviewed policy before any paid plan launches."
      />
      <div className="mt-10 max-w-2xl space-y-6 text-sm leading-relaxed text-muted">
        <div>
          <h2 className="text-sm font-semibold text-ink">What is stored</h2>
          <p className="mt-1.5">
            Account details, the documents you create, your templates and brand
            voice profiles, and a usage log of AI requests. Nothing more.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink">Who can read it</h2>
          <p className="mt-1.5">
            Your records are private to your account. Database row level security
            policies ensure one account cannot read another account&apos;s data, and
            authorization is enforced on the server rather than trusted from the
            browser.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink">Third-party services</h2>
          <p className="mt-1.5">
            AI requests are sent to a model provider from the server so that API
            keys never reach the browser. A search provider is used only if live
            research is configured. Each service is disclosed before it is enabled.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink">Deleting your data</h2>
          <p className="mt-1.5">
            Documents move to trash before permanent deletion. Account deletion,
            which removes all stored records, is available from settings once
            authentication ships.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink">Contact</h2>
          <p className="mt-1.5">
            A contact channel will be listed here before the product accepts real
            user data. No address is shown yet because no inbox is being monitored.
          </p>
        </div>
      </div>
    </Section>
  );
}
