import { ReactNode } from "react";

import { Toaster } from "sonner";

/**
 * Shared layout for the (statix) route group.
 *
 * Hosts a single <Toaster /> instance so toasts persist across
 * navigation between /auth/* and /admin/* (e.g., the "Signed in
 * successfully" toast fired by useVerifyOtp continues to render
 * after router.push("/admin")).
 */
export default function StatixLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster richColors position="top-center" />
    </>
  );
}
