"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronsLeft,
  ChevronsRight,
  CircleHelp,
  Crown,
  LogOut,
  Plus,
  Settings,
  UserRound,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { dashboardNav } from "@/lib/navigation";
import { useShell } from "./shell-context";

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function WorkspaceSelector({ collapsed }: { collapsed: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2.5 rounded-control border border-line bg-surface px-2.5 py-2 text-left transition-colors hover:bg-subtle",
        collapsed && "justify-center px-0",
      )}
      aria-label="Switch workspace"
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-brand-soft text-2xs font-semibold text-brand-ink">
        NW
      </span>
      {!collapsed ? (
        <>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-medium text-ink">
              Personal workspace
            </span>
            <span className="block truncate text-2xs text-muted">
              Free plan
            </span>
          </span>
          <ChevronsRight className="size-3.5 shrink-0 text-faint" aria-hidden="true" />
        </>
      ) : null}
    </button>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, href);

  const link = (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 rounded-control px-2.5 py-2 text-sm transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-brand-soft font-medium text-brand-ink"
          : "text-muted hover:bg-subtle hover:text-ink",
      )}
    >
      <Icon
        className={cn(
          "size-4 shrink-0",
          active ? "text-brand" : "text-faint group-hover:text-muted",
        )}
        aria-hidden="true"
      />
      {!collapsed ? <span className="truncate">{label}</span> : null}
      <span className="sr-only">{label}</span>
    </Link>
  );

  if (!collapsed) return link;
  return (
    <Tooltip label={label} className="w-full [&>a]:w-full">
      {link}
    </Tooltip>
  );
}

export function Sidebar() {
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useShell();
  const closeMobile = React.useCallback(() => setMobileOpen(false), [setMobileOpen]);

  return (
    <>
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-ink/30 backdrop-blur-[1px] lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-line bg-surface transition-[width,transform] duration-200 ease-out",
          "lg:sticky lg:top-0 lg:z-auto lg:h-dvh lg:translate-x-0",
          collapsed ? "lg:w-[68px]" : "lg:w-[248px]",
          "w-[272px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Workspace navigation"
      >
        <div
          className={cn(
            "flex h-14 shrink-0 items-center border-b border-line px-3",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          <Logo showWordmark={!collapsed} href="/dashboard" />
          <button
            type="button"
            onClick={closeMobile}
            className="rounded-control p-1.5 text-muted hover:bg-subtle lg:hidden"
            aria-label="Close navigation"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className={cn("shrink-0 px-3 pt-3", collapsed && "px-2")}>
          <WorkspaceSelector collapsed={collapsed} />
          <Link
            href="/dashboard/writer"
            onClick={closeMobile}
            className={cn(
              "mt-2 flex items-center justify-center gap-2 rounded-control bg-brand px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-ink",
              collapsed && "px-0",
            )}
          >
            <Plus className="size-4 shrink-0" aria-hidden="true" />
            {collapsed ? (
              <span className="sr-only">New document</span>
            ) : (
              <span>New document</span>
            )}
          </Link>
        </div>

        <nav
          className="scrollbar-thin mt-4 flex-1 overflow-y-auto px-3 pb-4"
          aria-label="Primary"
        >
          {dashboardNav.map((section) => (
            <div key={section.id} className="mb-5 last:mb-0">
              {!collapsed ? (
                <p className="mb-1.5 px-2.5 text-2xs font-semibold uppercase tracking-wider text-faint">
                  {section.label}
                </p>
              ) : (
                <div className="mx-auto mb-2 h-px w-6 bg-line" aria-hidden="true" />
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <NavLink
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      collapsed={collapsed}
                      onNavigate={closeMobile}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-line p-3">
          {!collapsed ? (
            <div className="mb-2 rounded-control border border-line bg-subtle px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wide text-faint">
                <Crown className="size-3" aria-hidden="true" />
                Current plan
              </div>
              <p className="mt-1 text-xs font-medium text-ink">Free</p>
              <Link
                href="/dashboard/billing"
                className="mt-1 inline-block text-2xs font-medium text-brand hover:text-brand-ink"
              >
                Compare plans
              </Link>
            </div>
          ) : null}

          <ul className="space-y-0.5">
            <li>
              <NavLink
                href="/dashboard/settings"
                label="Settings"
                icon={Settings}
                collapsed={collapsed}
                onNavigate={closeMobile}
              />
            </li>
            <li>
              <NavLink
                href="/dashboard/settings#help"
                label="Help & support"
                icon={CircleHelp}
                collapsed={collapsed}
                onNavigate={closeMobile}
              />
            </li>
          </ul>

          <div
            className={cn(
              "mt-2 flex items-center gap-2.5 rounded-control px-2 py-2",
              collapsed && "justify-center px-0",
            )}
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-subtle text-faint">
              <UserRound className="size-4" aria-hidden="true" />
            </span>
            {!collapsed ? (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium text-ink">
                  Guest
                </span>
                <span className="block truncate text-2xs text-muted">
                  Not signed in
                </span>
              </span>
            ) : null}
            {!collapsed ? (
              <Tooltip label="Sign out">
                <span className="rounded-control p-1.5 text-faint">
                  <LogOut className="size-3.5" aria-hidden="true" />
                </span>
              </Tooltip>
            ) : null}
          </div>

          <button
            type="button"
            onClick={toggleCollapsed}
            className={cn(
              "mt-2 hidden w-full items-center gap-2.5 rounded-control px-2.5 py-2 text-xs text-muted transition-colors hover:bg-subtle hover:text-ink lg:flex",
              collapsed && "justify-center px-0",
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={collapsed}
          >
            {collapsed ? (
              <ChevronsRight className="size-4" aria-hidden="true" />
            ) : (
              <>
                <ChevronsLeft className="size-4" aria-hidden="true" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
