import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AdminBreadcrumb } from "@/components/cms/AdminBreadcrumb";
import { BreadcrumbProvider } from "@/components/cms/BreadcrumbContext";
import { MediaDrawer } from "@/components/cms/MediaDrawer";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <BreadcrumbProvider>
      <div className="min-h-screen h-screen bg-background flex">
        {/* <Sidebar user={session.user} onSignOut={handleSignOut} /> */}

        {/* Main Content */}
        <div className="flex-1 flex flex-row overflow-y-hidden ">
          <main className="flex-1 overflow-y-auto p-5 ">
            <div className="max-w-7xl mx-auto">
              <AdminBreadcrumb />

              {children}
            </div>
          </main>
        </div>

        <MediaDrawer />
      </div>
    </BreadcrumbProvider>
  );
}
