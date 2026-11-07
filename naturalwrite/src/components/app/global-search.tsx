"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { dashboardNavItems } from "@/lib/navigation";

/**
 * Workspace search over the navigable surfaces. Documents, templates and brand
 * voices join the index in Phase 3 once those records are queryable server-side.
 */
export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      const id = window.setTimeout(() => inputRef.current?.focus(), 10);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  const needle = query.trim().toLowerCase();
  const results = needle
    ? dashboardNavItems.filter(
        (item) =>
          item.label.toLowerCase().includes(needle) ||
          item.description.toLowerCase().includes(needle),
      )
    : dashboardNavItems.slice(0, 6);

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 px-4 pt-[12vh] backdrop-blur-[1px]"
      role="dialog"
      aria-modal="true"
      aria-label="Search workspace"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-card border border-line bg-surface shadow-pop"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-line px-3.5">
          <Search className="size-4 shrink-0 text-faint" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages and tools…"
            className="h-12 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-faint"
            aria-label="Search query"
          />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-control p-1.5 text-faint hover:bg-subtle hover:text-ink"
            aria-label="Close search"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="scrollbar-thin max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted">
              No matches. Document and template search arrives in Phase 3.
            </p>
          ) : (
            <ul>
              {results.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <button
                      type="button"
                      onClick={() => go(item.href)}
                      className="flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left transition-colors hover:bg-subtle"
                    >
                      <Icon className="size-4 shrink-0 text-faint" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-ink">
                          {item.label}
                        </span>
                        <span className="block truncate text-2xs text-muted">
                          {item.description}
                        </span>
                      </span>
                      <ArrowRight className="size-3.5 shrink-0 text-faint" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className={cn("border-t border-line px-3.5 py-2.5")}>
          <p className="text-2xs text-faint">
            Searching pages and tools. Documents, templates and brand voices are
            added when storage ships in Phase 3.
          </p>
        </div>
      </div>
    </div>
  );
}
