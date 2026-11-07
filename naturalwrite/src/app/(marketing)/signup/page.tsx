import type { Metadata } from "next";
import Link from "next/link";
import { AuthPanel } from "@/components/marketing/auth-panel";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Create a free NaturalWrite account and start writing.",
};

export default function SignupPage() {
  return (
    <AuthPanel
      mode="signup"
      title="Create your account"
      subtitle="Start free. No credit card required."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand hover:text-brand-ink">
            Log in
          </Link>
        </>
      }
    />
  );
}
