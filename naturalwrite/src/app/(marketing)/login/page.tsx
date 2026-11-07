import type { Metadata } from "next";
import Link from "next/link";
import { AuthPanel } from "@/components/marketing/auth-panel";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your NaturalWrite workspace.",
};

export default function LoginPage() {
  return (
    <AuthPanel
      mode="login"
      title="Welcome back"
      subtitle="Log in to open your workspace and continue writing."
      footer={
        <>
          New to NaturalWrite?{" "}
          <Link href="/signup" className="font-medium text-brand hover:text-brand-ink">
            Create an account
          </Link>
        </>
      }
    />
  );
}
