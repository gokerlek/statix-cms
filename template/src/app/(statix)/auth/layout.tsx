import { ReactNode } from "react";

import { QueryProvider } from "@/statix/providers/query-provider";

import "@/statix/styles/statix.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <div data-statix>{children}</div>
    </QueryProvider>
  );
}
