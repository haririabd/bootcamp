"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { KanbanBoard } from "../components/kanban-board";
import { AuthGuard } from "../components/auth-guard";
import { Sidebar } from "../components/sidebar";
import { TopNav } from "../components/top-nav";
import { CreateBoardDialog } from "../components/create-board-dialog";
import { BoardsListSkeleton, BoardSkeleton } from "../components/loading-skeletons";
import { useBoards } from "../hooks/use-kanban";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";

function PageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlBoardId = searchParams.get("boardId");

  const { data: boardsData, isLoading, isError, refetch } = useBoards();
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);

  // Filtering state
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

  const boards = boardsData?.items ?? [];

  // Sync selected board with URL Parameter
  useEffect(() => {
    if (boards.length > 0) {
      if (urlBoardId && boards.find((b) => b.id === urlBoardId)) {
        // Valid board ID in URL, select it
        setSelectedBoardId(urlBoardId);
      } else if (!selectedBoardId || !boards.find((b) => b.id === selectedBoardId)) {
        // No board selected, or selected board was deleted: default to the first board
        setSelectedBoardId(boards[0].id);
        router.replace(`/?boardId=${boards[0].id}`);
      }
    } else {
      // User has 0 boards (e.g., they deleted the default seeded board)
      setSelectedBoardId(null);

      // Clean up the URL so it doesn't linger on a dead boardId
      if (urlBoardId) {
        router.replace("/");
      }
    }
  }, [boards, urlBoardId, selectedBoardId, router]);

  const handleBoardSwitch = (id: string) => {
    setSelectedBoardId(id);
    router.push(`/?boardId=${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-slate-50 dark:bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="h-16 border-b border-slate-200 dark:border-border px-8 flex items-center">
            <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          </div>
          <BoardsListSkeleton />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen bg-slate-50 dark:bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav />
          <div className="flex items-center justify-center flex-1 px-4">
            <div className="mx-auto max-w-sm rounded-xl border border-destructive/50 bg-destructive/5 p-6 text-center">
              <h2 className="text-lg font-semibold text-destructive">Failed to load boards</h2>
              <Button onClick={() => refetch()} className="mt-4" size="sm">Retry</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div className="flex h-screen bg-slate-50 dark:bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav />
          <div className="flex flex-col items-center justify-center flex-1 text-center px-4">
            <div className="rounded-2xl bg-white dark:bg-slate-900 border shadow-sm p-8 max-w-md w-full">
              <div className="mx-auto w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-4">
                <LayoutDashboard className="h-6 w-6 text-slate-400" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Welcome to Lazuar</h1>
              <p className="text-slate-500 mt-2 text-sm">
                Get started by creating your first board to organize your tasks.
              </p>
              <div className="mt-6">
                <CreateBoardDialog />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-background selection:bg-slate-200">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav
          currentBoardId={selectedBoardId ?? undefined}
          onBoardSwitch={handleBoardSwitch}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
        />
        {/* PHASE 1 FIX: Added min-h-0 to explicitly constrain the main wrapper's height */}
        <main className="flex-1 overflow-hidden flex flex-col min-h-0">
          {selectedBoardId ? (
            <KanbanBoard
              boardId={selectedBoardId}
              searchQuery={searchQuery}
              priorityFilter={priorityFilter}
            />
          ) : (
            <BoardSkeleton />
          )}
        </main>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AuthGuard fallback={<BoardSkeleton />}>
      {/* Suspense wrapper required for useSearchParams */}
      <Suspense fallback={<BoardSkeleton />}>
        <PageContent />
      </Suspense>
    </AuthGuard>
  );
}
