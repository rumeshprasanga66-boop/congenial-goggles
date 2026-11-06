"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/form";
import { cn } from "@/lib/cn";

/**
 * Template filters. Category and search live in the URL so a filtered view can
 * be reloaded or shared.
 */
export function TemplateFilters({ categories }: { categories: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [term, setTerm] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setTerm(searchParams.get("q") ?? "");
  }, [searchParams]);

  function apply(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (term === current) return;
    const timer = window.setTimeout(() => apply("q", term), 300);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  const active = searchParams.get("category") ?? "all";

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-faint"
          aria-hidden="true"
        />
        <label className="sr-only" htmlFor="template-search">
          Search templates
        </label>
        <Input
          id="template-search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search templates"
          className="pl-8"
        />
        {term && (
          <button
            type="button"
            onClick={() => setTerm("")}
            aria-label="Clear the search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-control p-1 text-faint hover:text-ink"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => apply("category", "all")}
          aria-pressed={active === "all"}
          className={cn(
            "rounded-control px-2.5 py-1.5 text-xs font-medium transition-colors",
            active === "all"
              ? "bg-ink text-surface"
              : "border border-line bg-surface text-muted hover:text-ink",
          )}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => apply("category", category)}
            aria-pressed={active === category}
            className={cn(
              "rounded-control px-2.5 py-1.5 text-xs font-medium transition-colors",
              active === category
                ? "bg-ink text-surface"
                : "border border-line bg-surface text-muted hover:text-ink",
            )}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
