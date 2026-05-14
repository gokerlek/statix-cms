import { ReactNode } from "react";

import { Toaster } from "sonner";

/**
 * Statix route-group shell.
 *
 * The root app/layout.tsx is the user's app — we don't add Statix-specific
 * UI there. This layer is everything Statix owns (auth + admin + api),
 * and hosts a single <Toaster /> instance so toasts survive navigation
 * between /auth/* and /admin/* routes (e.g. the "Signed in" toast fired
 * during sign-in keeps rendering after router.push("/admin")).
 */
export default function StatixLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster richColors position="top-center" />
    </>
  );
}
