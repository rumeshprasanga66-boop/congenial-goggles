"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Menu, PanelRight, Search, CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { findNavItem } from "@/lib/navigation";
import { useShell } from "./shell-context";
import { GlobalSearch } from "./global-search";

export function Topbar() {
  const pathname = usePathname();
  const { setMobileOpen } = useShell();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const item = findNavItem(pathname);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isShortcut =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (isShortcut) {
        event.preventDefault();
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur-md lg:px-6">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="-ml-1 rounded-control p-2 text-muted hover:bg-subtle hover:text-ink lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold text-ink">
            {item?.label ?? "Dashboard"}
          </h1>
          <p className="hidden truncate text-2xs text-muted sm:block">
            {item?.description ?? "Your workspace"}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className={cn(
            "group flex h-9 items-center gap-2 rounded-control border border-line bg-surface px-2.5 text-sm text-muted transition-colors hover:bg-subtle",
            "w-9 justify-center md:w-64 md:justify-start",
          )}
          aria-label="Search workspace"
        >
          <Search className="size-4 shrink-0 text-faint" aria-hidden="true" />
          <span className="hidden flex-1 text-left text-muted md:inline">
            Search…
          </span>
          <kbd className="hidden rounded border border-line bg-subtle px-1.5 py-0.5 text-2xs font-medium text-faint md:inline">
            ⌘K
          </kbd>
        </button>

        <Tooltip label="Notifications">
          <Link
            href="/dashboard#action-needed"
            className="relative rounded-control p-2 text-muted transition-colors hover:bg-subtle hover:text-ink"
            aria-label="Notifications"
          >
            <Bell className="size-5" aria-hidden="true" />
          </Link>
        </Tooltip>

        <Tooltip label="Help & support">
          <Link
            href="/dashboard/settings#help"
            className="hidden rounded-control p-2 text-muted transition-colors hover:bg-subtle hover:text-ink sm:inline-flex"
            aria-label="Help and support"
          >
            <CircleHelp className="size-5" aria-hidden="true" />
          </Link>
        </Tooltip>

        <Tooltip label="Your account">
          <Link
            href="/dashboard/settings"
            className="flex size-8 items-center justify-center rounded-full border border-line bg-subtle text-2xs font-semibold text-muted transition-colors hover:bg-canvas"
            aria-label="Your account"
          >
            G
          </Link>
        </Tooltip>

        <Button
          variant="ghost"
          size="sm"
          className="hidden xl:inline-flex"
          aria-label="Toggle assistant panel"
          disabled
          title="The assistant panel arrives with the writing studio in Phase 2."
        >
          <PanelRight className="size-4" aria-hidden="true" />
        </Button>
      </header>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
