import type { Metadata } from "next";
import { CreditCard } from "lucide-react";
import { ComingSoon } from "@/components/app/coming-soon";
import { PageHeader } from "@/components/app/page-header";

export const metadata: Metadata = {
  title: "Billing & Plans",
  description: "Plan, credits and invoices.",
};

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Plans"
        description="Manage your plan, credits and payment history."
      />
      <ComingSoon
        icon={CreditCard}
        title="Billing is not implemented"
        description="Stripe is only wired up when plans and usage limits are genuinely enforced. Until then there is nothing to charge, so no checkout button is shown."
        phase="Phase 6"
        requires={[
          "A Stripe account with products and prices configured",
          "STRIPE_SECRET_KEY and the webhook signing secret stored server-side",
        ]}
      />
    </div>
  );
}
