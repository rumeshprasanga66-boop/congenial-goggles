import Link from "next/link";
import { Info } from "lucide-react";
import { isAiConfigured } from "@/lib/ai/provider";

/**
 * Server-rendered notice shown when no AI provider key is configured.
 *
 * Rendering this on the server means the page tells the truth on first paint,
 * before the user fills in a brief and hits a failing request.
 */
export function AiStatusNotice() {
  if (isAiConfigured()) return null;

  return (
    <div className="flex items-start gap-2.5 rounded-card border border-caution/25 bg-caution/5 px-4 py-3">
      <Info className="mt-0.5 size-4 shrink-0 text-caution" aria-hidden="true" />
      <div className="min-w-0 text-xs leading-relaxed text-ink">
        <p className="font-medium">Generation is not configured on this deployment.</p>
        <p className="mt-0.5 text-muted">
          The studio is fully built, but no AI provider key is set, so requests will
          return an error explaining what is missing. An administrator can enable it by
          setting <code className="rounded bg-subtle px-1 py-0.5 text-2xs">OPENAI_API_KEY</code>{" "}
          in the server environment. See{" "}
          <Link href="/dashboard/settings" className="font-medium text-brand-ink underline-offset-2 hover:underline">
            settings
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
