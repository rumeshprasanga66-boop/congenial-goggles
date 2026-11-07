import * as React from "react";
import { cn } from "@/lib/cn";

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "brand" | "positive" | "caution" | "danger";
}) {
  const tones = {
    neutral: "border-line bg-subtle text-muted",
    brand: "border-brand/20 bg-brand-soft text-brand-ink",
    positive: "border-positive/20 bg-positive/10 text-positive",
    caution: "border-caution/20 bg-caution/10 text-caution",
    danger: "border-danger/20 bg-danger/10 text-danger",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
