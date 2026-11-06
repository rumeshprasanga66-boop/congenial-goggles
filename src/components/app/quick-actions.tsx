import Link from "next/link";
import {
  BookOpen,
  FileText,
  Lightbulb,
  Mail,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

interface QuickAction {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Every tile routes to the page that owns the workflow. */
const actions: QuickAction[] = [
  { label: "Write an article", href: "/dashboard/writer", icon: BookOpen },
  { label: "Rewrite text", href: "/dashboard/rewriter", icon: Sparkles },
  { label: "Create an email", href: "/dashboard/writer", icon: Mail },
  { label: "Generate ideas", href: "/dashboard/brainstorm", icon: Lightbulb },
  { label: "Research a topic", href: "/dashboard/research", icon: Search },
  { label: "Start from a template", href: "/dashboard/templates", icon: FileText },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.label}
            href={action.href}
            className="group flex flex-col gap-3 rounded-card border border-line bg-surface p-3.5 shadow-card transition-colors hover:border-brand/30 hover:bg-brand-soft/40"
          >
            <span className="flex size-8 items-center justify-center rounded-md border border-line bg-subtle text-muted transition-colors group-hover:border-brand/20 group-hover:bg-surface group-hover:text-brand">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <span className="text-xs font-medium leading-snug text-ink">
              {action.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
