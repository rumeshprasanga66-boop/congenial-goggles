import Link from "next/link";
import { AlertTriangle, Bell, CircleCheck, Info } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatRelativeTime } from "@/lib/format";
import type { NotificationRecord } from "@/lib/types";

const toneStyles = {
  info: { icon: Info, className: "text-brand" },
  caution: { icon: AlertTriangle, className: "text-caution" },
  danger: { icon: AlertTriangle, className: "text-danger" },
} as const;

/**
 * Renders only events the account actually produced. With no records stored yet
 * it shows the "all clear" state rather than synthetic alerts.
 */
export function ActionNeeded({
  notifications,
}: {
  notifications: NotificationRecord[];
}) {
  if (notifications.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-card border border-line bg-surface p-4 shadow-card">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-positive/20 bg-positive/10 text-positive">
          <CircleCheck className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">Nothing needs attention</p>
          <p className="mt-0.5 text-xs text-muted">
            Unfinished drafts, failed generations and low-credit warnings appear
            here. This panel only ever lists real account events.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-card">
      {notifications.map((notification) => {
        const { icon: Icon, className } = toneStyles[notification.tone];
        return (
          <li key={notification.id} className="flex items-start gap-3 p-4">
            <span
              className={cn(
                "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-line bg-subtle",
                className,
              )}
            >
              <Icon className="size-3.5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">
                {notification.title}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {notification.message}
              </p>
            </div>
            <span className="shrink-0 text-2xs text-faint">
              {formatRelativeTime(notification.createdAt)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function ActionNeededHeader() {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Bell className="size-3.5 text-faint" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-ink">Action needed</h3>
      </div>
      <Link
        href="/dashboard/usage"
        className="text-2xs font-medium text-brand hover:text-brand-ink"
      >
        View usage
      </Link>
    </div>
  );
}
