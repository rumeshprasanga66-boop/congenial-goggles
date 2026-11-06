import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Metric tile for the overview grid. `value` is always derived from stored
 * records; when no records exist yet the caller passes 0 and the tile shows a
 * zero rather than an invented number.
 */
export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-card border border-line bg-surface p-4 shadow-card",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted">{label}</p>
        <span className="flex size-7 items-center justify-center rounded-md border border-line bg-subtle text-faint">
          <Icon className="size-3.5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-ink tabular-nums">
        {value}
      </p>
      {hint ? <p className="mt-1 text-2xs text-faint">{hint}</p> : null}
    </div>
  );
}
