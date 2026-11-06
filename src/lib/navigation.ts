import {
  BarChart3,
  Brain,
  CreditCard,
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
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Short description reused by page headers and the command palette. */
  description: string;
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

/**
 * Single source of truth for the authenticated navigation. Every entry maps to
 * a real route so the sidebar can never render a dead link.
 */
export const dashboardNav: NavSection[] = [
  {
    id: "workspace",
    label: "Main workspace",
    items: [
      {
        label: "Overview",
        href: "/dashboard",
        icon: Home,
        description: "Your workspace at a glance",
      },
      {
        label: "AI Writer",
        href: "/dashboard/writer",
        icon: PenLine,
        description: "Draft new content with AI guidance",
      },
      {
        label: "My Documents",
        href: "/dashboard/documents",
        icon: FileText,
        description: "Every document you have created",
      },
      {
        label: "Templates",
        href: "/dashboard/templates",
        icon: LayoutTemplate,
        description: "Start from a proven structure",
      },
      {
        label: "Favorites",
        href: "/dashboard/favorites",
        icon: Star,
        description: "Documents you starred",
      },
    ],
  },
  {
    id: "tools",
    label: "AI writing tools",
    items: [
      {
        label: "Rewrite & Improve",
        href: "/dashboard/rewriter",
        icon: Sparkles,
        description: "Polish text you already have",
      },
      {
        label: "Brainstorm",
        href: "/dashboard/brainstorm",
        icon: Brain,
        description: "Generate and organise ideas",
      },
      {
        label: "Research Assistant",
        href: "/dashboard/research",
        icon: Search,
        description: "Find sources and summarise findings",
      },
      {
        label: "SEO Writer",
        href: "/dashboard/seo",
        icon: BarChart3,
        description: "Write for search and readers",
      },
      {
        label: "Brand Voice",
        href: "/dashboard/brand-voice",
        icon: Users,
        description: "Reusable writing preferences",
      },
    ],
  },
  {
    id: "management",
    label: "Management",
    items: [
      {
        label: "Usage & Credits",
        href: "/dashboard/usage",
        icon: BarChart3,
        description: "Track generations and spend",
      },
      {
        label: "Trash",
        href: "/dashboard/trash",
        icon: Trash2,
        description: "Restore or permanently delete",
      },
      {
        label: "Settings",
        href: "/dashboard/settings",
        icon: Settings,
        description: "Profile, defaults and security",
      },
      {
        label: "Billing & Plans",
        href: "/dashboard/billing",
        icon: CreditCard,
        description: "Plan, credits and invoices",
      },
    ],
  },
];

/** Flattened lookup used by the header to title the current route. */
export const dashboardNavItems: NavItem[] = dashboardNav.flatMap(
  (section) => section.items,
);

export function findNavItem(pathname: string): NavItem | undefined {
  return (
    dashboardNavItems.find((item) => item.href === pathname) ??
    dashboardNavItems.find(
      (item) => item.href !== "/dashboard" && pathname.startsWith(item.href),
    )
  );
}
