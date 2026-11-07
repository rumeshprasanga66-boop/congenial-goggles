"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/logo";
import { buttonStyles } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const links = [
  { label: "Features", href: "/features" },
  { label: "Use cases", href: "/features#use-cases" },
  { label: "Pricing", href: "/pricing" },
  { label: "Resources", href: "/features#resources" },
];

export function MarketingHeader() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="Main">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-control px-3 py-2 text-sm text-muted transition-colors hover:bg-subtle hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <Link href="/login" className={buttonStyles({ variant: "ghost", size: "md" })}>
            Log in
          </Link>
          <Link href="/signup" className={buttonStyles({ variant: "primary", size: "md" })}>
            Get started
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="ml-auto rounded-control p-2 text-muted hover:bg-subtle hover:text-ink md:hidden"
          aria-expanded={open}
          aria-controls="marketing-mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          {open ? (
            <X className="size-5" aria-hidden="true" />
          ) : (
            <Menu className="size-5" aria-hidden="true" />
          )}
        </button>
      </div>

      {open ? (
        <div
          id="marketing-mobile-nav"
          className="border-t border-line bg-surface px-4 pb-5 pt-3 md:hidden"
        >
          <nav className="flex flex-col" aria-label="Mobile">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-control px-3 py-2.5 text-sm text-muted hover:bg-subtle hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2">
            <Link
              href="/login"
              className={cn(buttonStyles({ variant: "secondary", size: "lg" }))}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className={cn(buttonStyles({ variant: "primary", size: "lg" }))}
            >
              Get started
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
