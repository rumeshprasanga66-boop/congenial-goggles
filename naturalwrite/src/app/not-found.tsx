import Link from "next/link";
import { Compass } from "lucide-react";
import { Logo } from "@/components/logo";
import { buttonStyles } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-16 text-center">
      <Logo />
      <span className="mt-8 flex size-11 items-center justify-center rounded-full border border-line bg-surface text-muted shadow-card">
        <Compass className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-5 text-2xs font-semibold uppercase tracking-wider text-faint">
        404
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
        We could not find that page
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        The link may be out of date, or the page may have moved. Your documents
        are unaffected.
      </p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link href="/dashboard" className={buttonStyles({ variant: "primary", size: "lg" })}>
          Go to the dashboard
        </Link>
        <Link href="/" className={buttonStyles({ variant: "secondary", size: "lg" })}>
          Back to the home page
        </Link>
      </div>
    </div>
  );
}
