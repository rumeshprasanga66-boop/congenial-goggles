import Link from "next/link";
import { Feather } from "lucide-react";
import { cn } from "@/lib/cn";

export function Logo({
  className,
  showWordmark = true,
  href = "/",
}: {
  className?: string;
  showWordmark?: boolean;
  href?: string;
}) {
  return (
    <Link
      href={href}
      aria-label="NaturalWrite home"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-control focus-visible:outline-none",
        className,
      )}
    >
      <span className="flex size-8 items-center justify-center rounded-[10px] bg-brand text-white shadow-sm">
        <Feather className="size-4" aria-hidden="true" />
      </span>
      {showWordmark ? (
        <span className="text-[15px] font-semibold tracking-tight text-ink">
          NaturalWrite
        </span>
      ) : null}
    </Link>
  );
}
