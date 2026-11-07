import {
  BarChart3,
  Brain,
  FileText,
  Home,
  LayoutTemplate,
  PenLine,
  Search,
  Settings,
  Sparkles,
  Star,
  Trash2,
  Users,
} from "lucide-react";

/**
 * Static illustration of the real dashboard layout. It mirrors the shipped
 * navigation and overview structure so the preview stays truthful to the app.
 */
const nav = [
  { label: "Overview", icon: Home, active: true },
  { label: "AI Writer", icon: PenLine },
  { label: "My Documents", icon: FileText },
  { label: "Templates", icon: LayoutTemplate },
  { label: "Favorites", icon: Star },
];

const tools = [
  { label: "Rewrite & Improve", icon: Sparkles },
  { label: "Brainstorm", icon: Brain },
  { label: "Research", icon: Search },
  { label: "Brand Voice", icon: Users },
];

const metrics = [
  { label: "Documents", value: "—" },
  { label: "Words written", value: "—" },
  { label: "Generations", value: "—" },
  { label: "Credits", value: "—" },
];

export function DashboardPreview() {
  return (
    <div
      className="overflow-hidden rounded-card border border-line bg-surface shadow-pop"
      aria-hidden="true"
    >
      <div className="flex items-center gap-1.5 border-b border-line bg-subtle px-4 py-3">
        <span className="size-2.5 rounded-full bg-line" />
        <span className="size-2.5 rounded-full bg-line" />
        <span className="size-2.5 rounded-full bg-line" />
        <span className="mx-auto rounded-md border border-line bg-surface px-3 py-1 text-2xs text-faint">
          naturalwrite.app/dashboard
        </span>
      </div>

      <div className="flex">
        <div className="hidden w-44 shrink-0 border-r border-line p-3 sm:block">
          <div className="mb-3 flex items-center gap-2 px-1">
            <span className="size-5 rounded-md bg-brand" />
            <span className="text-xs font-semibold text-ink">NaturalWrite</span>
          </div>
          <div className="mb-3 rounded-control bg-brand px-2 py-1.5 text-center text-2xs font-medium text-white">
            New document
          </div>
          <ul className="space-y-0.5">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.label}
                  className={`flex items-center gap-2 rounded-control px-2 py-1.5 text-2xs ${
                    item.active
                      ? "bg-brand-soft font-medium text-brand-ink"
                      : "text-muted"
                  }`}
                >
                  <Icon className="size-3" />
                  {item.label}
                </li>
              );
            })}
          </ul>
          <p className="mt-3 px-2 text-[9px] font-semibold uppercase tracking-wider text-faint">
            Tools
          </p>
          <ul className="mt-1 space-y-0.5">
            {tools.map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.label}
                  className="flex items-center gap-2 rounded-control px-2 py-1.5 text-2xs text-muted"
                >
                  <Icon className="size-3" />
                  {item.label}
                </li>
              );
            })}
          </ul>
          <div className="mt-3 space-y-0.5 border-t border-line pt-3">
            <div className="flex items-center gap-2 rounded-control px-2 py-1.5 text-2xs text-muted">
              <BarChart3 className="size-3" />
              Usage
            </div>
            <div className="flex items-center gap-2 rounded-control px-2 py-1.5 text-2xs text-muted">
              <Trash2 className="size-3" />
              Trash
            </div>
            <div className="flex items-center gap-2 rounded-control px-2 py-1.5 text-2xs text-muted">
              <Settings className="size-3" />
              Settings
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xs text-muted">Your workspace</p>
              <p className="mt-0.5 text-xs font-semibold text-ink">
                What would you like to create today?
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="rounded-control border border-line px-2 py-1 text-[9px] text-muted">
                Search
              </span>
              <span className="size-5 rounded-full border border-line bg-subtle" />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-lg border border-line bg-surface p-2.5"
              >
                <p className="text-[9px] text-muted">{metric.label}</p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-lg border border-line">
            <div className="flex items-center justify-between border-b border-line px-3 py-2">
              <p className="text-2xs font-semibold text-ink">
                Recent documents
              </p>
              <span className="text-[9px] text-brand">View all</span>
            </div>
            <div className="px-3 py-6 text-center">
              <p className="text-2xs font-medium text-ink">
                No documents yet
              </p>
              <p className="mt-1 text-[9px] text-muted">
                Create your first document to fill this space.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
