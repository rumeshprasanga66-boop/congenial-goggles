import type { Metadata } from "next";
import { Section, SectionHeading } from "@/components/marketing/section";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The terms for using NaturalWrite.",
};

export default function TermsPage() {
  return (
    <Section className="py-16 sm:py-20">
      <SectionHeading
        align="left"
        eyebrow="Legal"
        title="Terms of service"
        description="A plain-language summary. It will be replaced by complete, reviewed terms before any paid plan launches."
      />
      <div className="mt-10 max-w-2xl space-y-6 text-sm leading-relaxed text-muted">
        <div>
          <h2 className="text-sm font-semibold text-ink">Your content is yours</h2>
          <p className="mt-1.5">
            You keep ownership of everything you write and everything you save in
            the workspace. You are responsible for making sure your use of the
            service complies with the law where you are.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink">What the service is</h2>
          <p className="mt-1.5">
            NaturalWrite is a writing tool. It assists with drafting and editing.
            It does not guarantee that output is accurate, original or suitable for
            a particular purpose, and you should review anything before publishing
            it.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink">Usage limits</h2>
          <p className="mt-1.5">
            Plans include finite AI generation allowances. Limits are stated in the
            product and enforced, rather than described as unlimited.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink">Acceptable use</h2>
          <p className="mt-1.5">
            Do not use the service to produce unlawful content, to impersonate
            people deceptively, or to interfere with the service or other accounts.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink">Changes</h2>
          <p className="mt-1.5">
            These terms will be finalised before paid plans open. Material changes
            will be communicated in the product.
          </p>
        </div>
      </div>
    </Section>
  );
}
