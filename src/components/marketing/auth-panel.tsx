"use client";

import * as React from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldHint, Input, Label } from "@/components/ui/form";

/**
 * Auth form shell.
 *
 * Supabase Auth is wired in Phase 3. Until then the form validates input
 * locally and reports honestly that accounts cannot be created yet, instead of
 * showing a fake success message.
 */
export function AuthPanel({
  mode,
  title,
  subtitle,
  footer,
}: {
  mode: "login" | "signup";
  title: string;
  subtitle: string;
  footer: React.ReactNode;
}) {
  const [notice, setNotice] = React.useState<string | null>(null);
  const isSignup = mode === "signup";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(
      isSignup
        ? "Accounts cannot be created yet. Authentication is wired up in Phase 3, and this form will create a real Supabase account when it ships."
        : "Logging in is not available yet. Authentication is wired up in Phase 3.",
    );
  }

  return (
    <div className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto w-full max-w-sm">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-card border border-line bg-surface p-6 shadow-card"
          noValidate
        >
          {isSignup ? (
            <div className="mb-4">
              <Label htmlFor="full-name">Full name</Label>
              <Input
                id="full-name"
                name="fullName"
                autoComplete="name"
                placeholder="Ada Lovelace"
                className="mt-1.5"
              />
            </div>
          ) : null}

          <div className="mb-4">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="mt-1.5"
            />
          </div>

          <div className={isSignup ? "mb-4" : "mb-5"}>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              {!isSignup ? (
                <span className="text-2xs text-faint">
                  Password reset arrives in Phase 3
                </span>
              ) : null}
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={isSignup ? "new-password" : "current-password"}
              placeholder="At least 8 characters"
              className="mt-1.5"
            />
            {isSignup ? (
              <FieldHint>Use at least 8 characters.</FieldHint>
            ) : null}
          </div>

          <Button type="submit" size="lg" className="w-full">
            {isSignup ? "Create account" : "Log in"}
          </Button>
          {notice ? (
            <div
              role="status"
              className="mt-4 flex gap-2.5 rounded-control border border-caution/20 bg-caution/5 px-3 py-2.5"
            >
              <Info className="mt-0.5 size-3.5 shrink-0 text-caution" aria-hidden="true" />
              <p className="text-xs leading-relaxed text-muted">{notice}</p>
            </div>
          ) : null}
        </form>

        <p className="mt-6 text-center text-xs text-muted">{footer}</p>
      </div>
    </div>
  );
}
