import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { Toaster } from "sonner";

import { getSession } from "@/statix/lib/session";
import { QueryProvider } from "@/statix/providers/query-provider";
import { ErrorBoundary } from "@/statix/components/shared/ErrorBoundary";
import { AdminBreadcrumb } from "@/statix/components/layout/AdminBreadcrumb";
import { BreadcrumbProvider } from "@/statix/components/layout/BreadcrumbContext";
import { MediaDrawer } from "@/statix/components/media/MediaDrawer";
import { TooltipProvider } from "@/statix/components/ui/tooltip";

import "@/statix/styles/statix.css";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <QueryProvider>
      <TooltipProvider>
        <div data-statix className="min-h-screen h-screen bg-background flex">
          {/* Main Content */}
          <BreadcrumbProvider>
            <div className="flex-1 flex flex-row overflow-y-hidden">
              <main className="flex-1 overflow-y-auto p-5">
                <div className="max-w-7xl mx-auto">
                  <AdminBreadcrumb />
                  <ErrorBoundary>{children}</ErrorBoundary>
                </div>
              </main>
            </div>
          </BreadcrumbProvider>

          <MediaDrawer />
          <Toaster richColors position="top-center" />
        </div>
      </TooltipProvider>
    </QueryProvider>
  );
}
