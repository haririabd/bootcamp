"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function BoardSkeleton() {
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      <div className="px-4 md:px-6 py-3 md:py-4 border-b">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>
      <div className="flex gap-4 p-4 md:p-6 overflow-hidden">
        {[1, 2, 3].map((col) => (
          <ColumnSkeleton key={col} cardCount={col + 1} />
        ))}
      </div>
    </div>
  );
}

export function ColumnSkeleton({ cardCount = 3 }: { cardCount?: number }) {
  return (
    <div className="w-[300px] shrink-0 rounded-lg border bg-muted/40 dark:bg-muted/20 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-8 rounded-full" />
      </div>
      {Array.from({ length: cardCount }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-md border bg-background p-3 space-y-2 shadow-sm">
      <Skeleton className="h-4 w-[80%]" />
      <Skeleton className="h-3 w-[50%]" />
    </div>
  );
}

export function BoardsListSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-in fade-in duration-300">
      <div className="space-y-4 text-center">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-72 mx-auto" />
        <Skeleton className="h-10 w-36 mx-auto mt-4" />
      </div>
    </div>
  );
}
