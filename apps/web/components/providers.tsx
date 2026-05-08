"use client";

import { QueryCache, MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import { ErrorBoundaryFallback } from "./error-boundary-fallback";
import { ThemeProvider } from "./theme-provider";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error: any) => {
              const status = error?.status;
              // Do not retry on client errors (4xx) EXCEPT 429 (Too many requests)
              if (status >= 400 && status < 500 && status !== 429) return false;
              // Retry on network errors (undefined status) or server errors (5xx)
              return failureCount < 3;
            },
          },
          mutations: {
            retry: false,
          },
        },
        queryCache: new QueryCache({
          onError: (error: any, query) => {
            const status = error?.status;
            if (query.queryKey[0] === "auth") return;

            switch (status) {
              case 401:
                // Let the AuthGuard handle the redirect. Don't force window.location here
                // to avoid infinite loops if the API is returning 401s globally.
                break;
              case 403:
                toast.error("Access denied. You don't have permission to perform this action.");
                break;
              case 409:
                toast.warning("Data was updated by someone else. Refreshing...");
                queryClient.invalidateQueries();
                break;
              case 429:
                toast.warning("Too many requests. Please wait a moment and try again.");
                break;
              case 500:
              case 502:
              case 503:
              case 504:
                toast.error("Server is currently unavailable. Please try again later.");
                break;
              default:
                if (!navigator.onLine || status === undefined) {
                  toast.error("Network error. Unable to reach the server.");
                }
                break;
            }
          },
        }),
        mutationCache: new MutationCache({
          onError: (error: any, _variables, _context, mutation) => {
            if (mutation.options.onError) return;
            const status = error?.status;

            switch (status) {
              case 401:
                break;
              case 403:
                toast.error("Access denied.");
                break;
              case 409:
                toast.warning("This item was modified by someone else. Refreshing...");
                queryClient.invalidateQueries();
                break;
              case 429:
                toast.warning("Too many requests. Please wait and try again.");
                break;
              case 500:
              case 502:
              case 503:
              case 504:
                toast.error("Server error. Please try again.");
                break;
              default:
                if (!navigator.onLine || status === undefined) {
                  toast.error("Network error. Changes cannot be saved right now.");
                }
                break;
            }
          },
        }),
      })
  );

  return (
    <ErrorBoundary
      FallbackComponent={ErrorBoundaryFallback}
      onReset={() => {
        queryClient.clear();
        window.location.reload();
      }}
    >
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
