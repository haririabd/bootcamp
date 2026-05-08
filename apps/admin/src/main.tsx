import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import { toast } from "sonner";
import App from "./App.tsx";
import { ToastProvider } from "./components/toast-provider.tsx";
import { ErrorBoundaryFallback } from "./components/error-boundary-fallback.tsx";
import { OfflineBanner } from "./components/offline-banner.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";

// Import the Inter font
import "@fontsource-variable/inter";
import "./index.css";

// Grab the base URL from Vite config (defaults to '/admin/')
const BASENAME = import.meta.env.BASE_URL;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        const status = error?.status;
        // Do not retry on client errors (4xx) EXCEPT 429 (Too many requests)
        if (status >= 400 && status < 500 && status !== 429) return false;
        // Retry on network errors (undefined status) or server errors (5xx)
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error: any, query) => {
      const status = error?.status;

      // Do not globally intercept the "me" auth check, let the AuthGuard handle it
      if (query.queryKey[0] === "me") return;

      // Only redirect if it's explicitly a 401 Unauthorized
      if (status === 401) {
        window.location.href = `${BASENAME}login`;
        return;
      }

      switch (status) {
        case 403:
          toast.error("Access denied. Admin privileges required.");
          break;
        case 409:
          toast.warning("Data was updated by someone else. Refreshing...");
          queryClient.invalidateQueries();
          break;
        case 429:
          toast.warning("Too many requests. Please wait a moment.");
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
      // If the mutation has its own local onError handler, let it handle the error
      if (mutation.options.onError) return;

      const status = error?.status;

      switch (status) {
        case 401:
          window.location.href = `${BASENAME}login`;
          break;
        case 403:
          toast.error("Access denied. Admin privileges required.");
          break;
        case 409:
          toast.warning("Item was modified by someone else. Refreshing...");
          queryClient.invalidateQueries();
          break;
        case 429:
          toast.warning("Too many requests. Please wait.");
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
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary
      FallbackComponent={ErrorBoundaryFallback}
      onReset={() => {
        queryClient.clear();
        window.location.reload();
      }}
    >
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <OfflineBanner />
          {/* Add basename here to sync React Router with Vite's base config */}
          <BrowserRouter basename={BASENAME}>
            <App />
          </BrowserRouter>
          <ToastProvider />
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
);
