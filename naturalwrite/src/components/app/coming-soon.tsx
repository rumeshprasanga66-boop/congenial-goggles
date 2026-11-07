import { Hammer, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

/**
 * Honest placeholder for surfaces whose backend ships in a later phase.
 * It states plainly what is not built yet and what will make it work, so no
 * button appears functional when it is not.
 */
export function ComingSoon({
  icon: Icon = Hammer,
  title,
  description,
  phase,
  requires,
}: {
  icon?: LucideIcon;
  title: string;
  description: string;
  phase: string;
  requires?: string[];
}) {
  return (
    <Card className="p-6 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-control border border-line bg-subtle text-muted">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-ink">{title}</h2>
            <Badge tone="caution">Not built yet</Badge>
          </div>
          <p className="mt-1.5 max-w-2xl text-sm text-muted">{description}</p>
          <p className="mt-3 text-xs text-faint">
            Scheduled for <span className="font-medium text-muted">{phase}</span>.
          </p>
          {requires && requires.length > 0 ? (
            <div className="mt-4 rounded-control border border-line bg-subtle px-3.5 py-3">
              <p className="text-2xs font-semibold uppercase tracking-wide text-faint">
                Needs configuration
              </p>
              <ul className="mt-2 space-y-1.5">
                {requires.map((entry) => (
                  <li
                    key={entry}
                    className="flex gap-2 text-xs text-muted"
                  >
                    <span
                      className="mt-1.5 size-1 shrink-0 rounded-full bg-faint"
                      aria-hidden="true"
                    />
                    <span>{entry}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
