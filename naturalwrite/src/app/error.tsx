"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button, buttonStyles } from "@/components/ui/button";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Replace with real error reporting once a provider is configured.
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-16 text-center">
      <span className="flex size-11 items-center justify-center rounded-full border border-danger/20 bg-danger/5 text-danger">
        <AlertTriangle className="size-5" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        This page hit an unexpected error. You can try again, and if it keeps
        happening the details below will help diagnose it.
      </p>
      {error.digest ? (
        <p className="mt-3 rounded-control border border-line bg-subtle px-3 py-1.5 font-mono text-2xs text-faint">
          Reference: {error.digest}
        </p>
      ) : null}
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={reset}>
          Try again
        </Button>
        <Link href="/dashboard" className={buttonStyles({ variant: "secondary", size: "lg" })}>
          Go to the dashboard
        </Link>
      </div>
    </div>
  );
}
