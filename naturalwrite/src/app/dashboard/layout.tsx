import type { Metadata } from "next";
import { ShellProvider } from "@/components/app/shell-context";
import { Sidebar } from "@/components/app/sidebar";
import { Topbar } from "@/components/app/topbar";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your NaturalWrite writing workspace.",
};

/**
 * The workspace is rendered per request. The greeting and date must reflect the
 * moment the user opens the page, and Phase 3 reads the signed-in user's data.
 */
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ShellProvider>
      <div className="flex min-h-dvh bg-canvas">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <main
            id="main-content"
            className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 lg:px-6 lg:py-8"
          >
            {children}
          </main>
        </div>
      </div>
    </ShellProvider>
  );
}
