import * as React from "react";
import { cn } from "@/lib/cn";

/** Centered marketing section with consistent vertical rhythm and container width. */
export function Section({
  className,
  children,
  id,
}: {
  className?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20 lg:px-8", className)}
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl",
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-pretty text-base leading-relaxed text-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}
