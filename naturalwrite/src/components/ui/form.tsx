import * as React from "react";
import { cn } from "@/lib/cn";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-control border border-line bg-surface px-3 text-sm text-ink placeholder:text-faint",
        "transition-colors hover:border-faint/60 disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-control border border-line bg-surface px-3 py-2 text-sm leading-relaxed text-ink placeholder:text-faint",
        "transition-colors hover:border-faint/60 disabled:cursor-not-allowed disabled:bg-subtle",
        className,
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-xs font-medium text-ink", className)}
      {...props}
    />
  );
}

export function FieldHint({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("mt-1 text-xs text-muted", className)} {...props} />;
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-9 w-full appearance-none rounded-control border border-line bg-surface px-3 pr-8 text-sm text-ink",
        "transition-colors hover:border-faint/60 disabled:cursor-not-allowed disabled:bg-subtle",
        className,
      )}
      {...props}
    />
  );
}
