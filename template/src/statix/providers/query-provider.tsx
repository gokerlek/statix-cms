"use client";

import { useState } from "react";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { toast } from "sonner";

import ui from "@/statix/content/ui.json";

/**
 * Optimized cache settings for static CMS:
 * - staleTime: Data considered fresh for 5 minutes (reduces API calls)
 * - gcTime: Keep unused data in cache for 30 minutes
 * - refetchOnWindowFocus: Disabled to prevent unnecessary refetches
 *
 * Error handling policy:
 * - Queries: the global QueryCache.onError surfaces a generic toast because
 *   most query errors are network-level and consumers don't always have a
 *   place to render an inline error.
 * - Mutations: the global handler ONLY logs. Each mutation hook is expected
 *   to define its own `onError` with a domain-specific message (see
 *   use-trash.ts, use-users.ts, use-media.ts). This avoids the double-toast
 *   that happens when both local + global handlers fire (TanStack v5 does
 *   not suppress the global handler when a local one is present).
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is fresh for 5 minutes - no refetch during this time
            staleTime: 5 * 60 * 1000,
            // Keep data in cache for 30 minutes
            gcTime: 30 * 60 * 1000,
            // Don't refetch on window focus (CMS data rarely changes externally)
            refetchOnWindowFocus: false,
            // Retry once on failure
            retry: 1,
            // Don't refetch on reconnect
            refetchOnReconnect: false,
          },
        },
        queryCache: new QueryCache({
          onError: (error) => {
            console.error("Global Query Error:", error);
            toast.error(`${ui.toasts.error.globalQuery}: ${error.message}`);
          },
        }),
        mutationCache: new MutationCache({
          onError: (error) => {
            // Log only. Each mutation hook is responsible for its own toast.
            console.error("Mutation error:", error);
          },
        }),
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
