"use client";

import { useState } from "react";

import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { toast } from "sonner";

import ui from "@/content/ui.json";

/**
 * Optimized cache settings for static CMS:
 * - staleTime: Data considered fresh for 5 minutes (reduces API calls)
 * - gcTime: Keep unused data in cache for 30 minutes
 * - refetchOnWindowFocus: Disabled to prevent unnecessary refetches
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
            console.error("Global Mutation Error:", error);
            toast.error(`${ui.toasts.error.globalMutation}: ${error.message}`);
          },
        }),
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
