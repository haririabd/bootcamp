"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      queryClient.invalidateQueries();
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [queryClient]);

  if (!isOffline) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 dark:bg-amber-600 text-amber-950 dark:text-amber-50 px-4 py-2 text-center text-sm font-medium shadow-md flex items-center justify-center gap-2"
      role="alert"
      aria-live="polite"
    >
      <WifiOff className="h-4 w-4" />
      You are offline. Changes will not be saved.
    </div>
  );
}
