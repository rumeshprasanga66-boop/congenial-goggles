import type { Metadata } from "next";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { Section, SectionHeading } from "@/components/marketing/section";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple plans for NaturalWrite. Start free and upgrade when your writing needs more room.",
};

interface Plan {
  name: string;
  price: string;
  cadence: string;
  summary: string;
  cta: string;
  featured?: boolean;
  available: boolean;
  features: string[];
}

const plans: Plan[] = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    summary: "For trying the workspace and writing the occasional piece.",
    cta: "Start for free",
    available: true,
    features: [
      "The full dashboard workspace",
      "Document editor with autosave",
      "A monthly allowance of AI generations",
      "Templates and brainstorming",
    ],
  },
  {
    name: "Starter",
    price: "$9",
    cadence: "per month",
    summary: "For regular writing with more generations each month.",
    cta: "Choose Starter",
    featured: true,
    available: false,
    features: [
      "Everything in Free",
      "A larger monthly generation allowance",
      "Brand voice profiles",
      "Priority generation queue",
    ],
  },
  {
    name: "Pro",
    price: "$24",
    cadence: "per month",
    summary: "For freelancers and professionals producing content weekly.",
    cta: "Choose Pro",
    available: false,
    features: [
      "Everything in Starter",
      "Research assistant with source links",
      "Long-form generation in sections",
      "Export to DOCX",
    ],
  },
  {
    name: "Business",
    price: "Custom",
    cadence: "talk to us",
    summary: "For teams that need shared standards and higher limits.",
    cta: "Contact us",
    available: false,
    features: [
      "Everything in Pro",
      "Shared brand voices",
      "Consolidated usage reporting",
      "Onboarding support",
    ],
  },
];

const comparison: Array<{ label: string; values: Array<boolean | string> }> = [
  { label: "Dashboard workspace", values: [true, true, true, true] },
  { label: "Document editor", values: [true, true, true, true] },
  { label: "AI generations", values: ["Limited", "More", "High", "Custom"] },
  { label: "Brand voice profiles", values: [false, true, true, true] },
  { label: "Research assistant", values: [false, false, true, true] },
  { label: "DOCX export", values: [false, false, true, true] },
  { label: "Shared team voices", values: [false, false, false, true] },
];

const faqs = [
  {
    question: "Is there really a free plan?",
    answer:
      "Yes. The workspace and editor are usable on the free plan with a monthly allowance of AI generations. You do not need a card to start.",
  },
  {
    question: "Do you promise unlimited AI usage?",
    answer:
      "No. Every plan has a finite allowance, because generation costs real money to run. Limits are stated plainly once they are enforced in the product.",
  },
  {
    question: "Can I change plans later?",
    answer:
      "Plans are designed to be changed at any time. Upgrades and downgrades open up when billing ships, and your existing documents are never affected.",
  },
  {
    question: "What happens to my documents if I stop paying?",
    answer:
      "Your work stays in your account. You keep access to your documents even if you move back to the free plan.",
  },
];

export default function PricingPage() {
  return (
    <>
      <Section className="pb-10 pt-16 sm:pt-20">
        <SectionHeading
          eyebrow="Pricing"
          title="Straightforward plans, stated limits"
          description="Start free. Move up when your writing does. Every plan includes the workspace and the editor; the difference is how much generation you get."
        />
      </Section>

      <Section className="pt-0">
        <div className="grid gap-4 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "flex flex-col rounded-card border bg-surface p-6 shadow-card",
                plan.featured ? "border-brand/40 ring-1 ring-brand/20" : "border-line",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-ink">{plan.name}</h2>
                {plan.featured ? <Badge tone="brand">Most popular</Badge> : null}
              </div>
              <p className="mt-4 flex items-baseline gap-1.5">
                <span className="text-3xl font-semibold tracking-tight text-ink">
                  {plan.price}
                </span>
                <span className="text-xs text-muted">{plan.cadence}</span>
              </p>
              <p className="mt-2 min-h-10 text-sm leading-relaxed text-muted">
                {plan.summary}
              </p>

              <div className="mt-5">
                {plan.available ? (
                  <Link
                    href="/signup"
                    className={cn(
                      buttonStyles({
                        variant: plan.featured ? "primary" : "secondary",
                        size: "md",
                      }),
                      "w-full",
                    )}
                  >
                    {plan.cta}
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    title="Checkout arrives with billing in Phase 6."
                    className={cn(
                      buttonStyles({ variant: "secondary", size: "md" }),
                      "w-full cursor-not-allowed",
                    )}
                  >
                    Coming soon
                  </button>
                )}
              </div>

              <ul className="mt-6 space-y-2.5 border-t border-line pt-5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs text-muted">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-positive" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-5 text-center text-xs text-faint">
          Paid plans are not purchasable yet. Billing is implemented in Phase 6,
          and plan limits are shown only once they are enforced.
        </p>
      </Section>

      <Section className="border-t border-line bg-subtle">
        <SectionHeading
          eyebrow="Compare"
          title="What changes between plans"
          description="Everything else in the workspace is identical across plans."
        />
        <div className="mt-10 overflow-x-auto rounded-card border border-line bg-surface shadow-card">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="px-4 py-3 text-left text-2xs font-semibold uppercase tracking-wide text-faint">
                  Feature
                </th>
                {plans.map((plan) => (
                  <th
                    key={plan.name}
                    scope="col"
                    className="px-4 py-3 text-center text-2xs font-semibold uppercase tracking-wide text-faint"
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.label} className="border-b border-line last:border-0">
                  <th scope="row" className="px-4 py-3 text-left text-xs font-medium text-ink">
                    {row.label}
                  </th>
                  {row.values.map((value, index) => (
                    <td key={index} className="px-4 py-3 text-center text-xs text-muted">
                      {typeof value === "boolean" ? (
                        value ? (
                          <Check className="mx-auto size-3.5 text-positive" aria-hidden="true" />
                        ) : (
                          <Minus className="mx-auto size-3.5 text-faint" aria-hidden="true" />
                        )
                      ) : (
                        value
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section>
        <SectionHeading eyebrow="FAQ" title="Questions about plans" />
        <dl className="mx-auto mt-10 max-w-3xl divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-card">
          {faqs.map((faq) => (
            <div key={faq.question} className="px-5 py-5">
              <dt className="text-sm font-semibold text-ink">{faq.question}</dt>
              <dd className="mt-1.5 text-sm leading-relaxed text-muted">
                {faq.answer}
              </dd>
            </div>
          ))}
        </dl>
      </Section>
    </>
  );
}
