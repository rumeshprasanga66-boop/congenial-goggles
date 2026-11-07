"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Lightweight tooltip used for collapsed-sidebar labels and icon-only controls.
 * CSS-driven so it works without a positioning library, and it stays out of the
 * accessibility tree because the trigger always carries its own label.
 */
export function Tooltip({
  label,
  side = "right",
  children,
  className,
}: {
  label: string;
  side?: "right" | "bottom";
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open ? (
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-2xs font-medium text-white shadow-pop",
            side === "right"
              ? "left-full top-1/2 ml-2 -translate-y-1/2"
              : "left-1/2 top-full mt-2 -translate-x-1/2",
          )}
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}
