"use client";

import * as React from "react";

type ShellContextValue = {
  /** Desktop sidebar collapsed to icon rail. Persisted in localStorage. */
  collapsed: boolean;
  toggleCollapsed: () => void;
  /** Mobile navigation drawer visibility. */
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
};

const ShellContext = React.createContext<ShellContextValue | null>(null);
const STORAGE_KEY = "naturalwrite:sidebar-collapsed";

export function ShellProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "true");
    } catch {
      /* Private browsing can block storage; the default state is fine. */
    }
  }, []);

  const toggleCollapsed = React.useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* Ignore storage failures. */
      }
      return next;
    });
  }, []);

  const value = React.useMemo(
    () => ({ collapsed, toggleCollapsed, mobileOpen, setMobileOpen }),
    [collapsed, toggleCollapsed, mobileOpen],
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

export function useShell() {
  const context = React.useContext(ShellContext);
  if (!context) {
    throw new Error("useShell must be used inside a ShellProvider");
  }
  return context;
}
