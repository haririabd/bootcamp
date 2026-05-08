"use client";

import { useState } from "react";
import { Search, Menu, LayoutDashboard, MoreHorizontal, Pencil, Trash2, ListFilter, UserPlus } from "lucide-react";
import { useBoards, useBoard, useUpdateBoard, useDeleteBoard } from "../hooks/use-kanban";
import { useCurrentUser } from "../hooks/use-auth";
import { BoardSwitcher } from "./board-switcher";
import { CreateBoardDialog } from "./create-board-dialog";
import { EditBoardDialog } from "./edit-board-dialog";
import { ConfirmDialog } from "./confirm-dialog";
import { ShareBoardDialog } from "./share-board-dialog";
import { ThemeToggle } from "./theme-toggle";
import { SidebarNav } from "./sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopNavProps {
  currentBoardId?: string;
  onBoardSwitch?: (boardId: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  priorityFilter?: string | null;
  onPriorityFilterChange?: (p: string | null) => void;
}

export function TopNav({
  currentBoardId,
  onBoardSwitch,
  searchQuery,
  onSearchChange,
  priorityFilter,
  onPriorityFilterChange
}: TopNavProps) {

  const { data: user } = useCurrentUser();
  const { data: boardsData } = useBoards();
  const { data: boardDetail } = useBoard(currentBoardId || "");

  const updateBoard = useUpdateBoard();
  const deleteBoard = useDeleteBoard();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const boards = boardsData?.items ?? [];
  const currentBoard = boards.find(b => b.id === currentBoardId);

  return (
    <>
      <header className="h-16 bg-white dark:bg-background border-b border-slate-200 dark:border-border flex items-center justify-between px-4 md:px-6 shrink-0">

        {/* LEFT SIDE: Menu + Unified Breadcrumb & Board Actions */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2 text-slate-500">
                  <Menu size={18} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 flex flex-col">
                <SheetHeader className="h-16 px-6 mb-2 flex flex-col justify-center text-left">
                  <SheetTitle className="flex items-center gap-2">
                    <span>Lazuar</span>
                  </SheetTitle>
                  <SheetDescription className="sr-only">Navigation Menu</SheetDescription>
                </SheetHeader>
                <SidebarNav onNavigate={() => setMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex items-center text-sm text-slate-500">
            <span className="hidden sm:inline hover:text-slate-700 transition-colors cursor-pointer">Workspace</span>
            <span className="hidden sm:inline text-slate-300 mx-2">/</span>

            {currentBoardId && boards.length > 0 && onBoardSwitch && (
              <div className="flex items-center gap-1">
                <BoardSwitcher boards={boards} currentBoardId={currentBoardId} onSwitch={onBoardSwitch} />

                {/* Subtle Divider */}
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

                {/* Inline Board Actions */}
                <div className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity">

                  {/* Filter Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant={priorityFilter ? "secondary" : "ghost"} size="sm" className="hidden sm:flex h-8 text-xs font-medium px-2.5">
                        <ListFilter className="mr-1.5 h-3.5 w-3.5" />
                        {priorityFilter ? `Priority: ${priorityFilter}` : "Filter"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-xl">
                      <DropdownMenuItem onClick={() => onPriorityFilterChange?.(null)} className={!priorityFilter ? "bg-accent" : ""}>
                        All Priorities
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onPriorityFilterChange?.("high")} className={priorityFilter === "high" ? "bg-accent" : ""}>High</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onPriorityFilterChange?.("medium")} className={priorityFilter === "medium" ? "bg-accent" : ""}>Medium</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onPriorityFilterChange?.("low")} className={priorityFilter === "low" ? "bg-accent" : ""}>Low</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Board Options Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="rounded-xl w-48">
                      <DropdownMenuItem onClick={() => setShareOpen(true)}>
                        <UserPlus className="mr-2 h-4 w-4" /> Share board
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditOpen(true)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit board details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete board
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: Global Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">

          {/* Global Search Input */}
          <div className="relative group hidden lg:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery || ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl h-10 px-10 text-sm focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 w-64 transition-all"
            />
          </div>

          <ThemeToggle />

          <CreateBoardDialog />
        </div>
      </header>

      {/* Board Management Dialogs */}
      {currentBoardId && currentBoard && (
        <>
          <EditBoardDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            boardId={currentBoardId}
            currentTitle={currentBoard.title}
            currentDescription={currentBoard.description}
            onSave={(data) => {
              updateBoard.mutate({ boardId: currentBoardId, ...data }, { onSuccess: () => setEditOpen(false) });
            }}
            saving={updateBoard.isPending}
          />

          <ConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title="Delete Board"
            description="Are you sure you want to delete this board? All columns and tasks will be permanently removed. This action cannot be undone."
            confirmLabel="Delete Board"
            variant="destructive"
            onConfirm={() => {
              deleteBoard.mutate({ boardId: currentBoardId }, { onSuccess: () => setDeleteOpen(false) });
            }}
            loading={deleteBoard.isPending}
          />
        </>
      )}

      {/* Share Board Dialog */}
      {currentBoardId && boardDetail && (
        <ShareBoardDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          board={boardDetail}
          currentUserId={user?.id}
        />
      )}
    </>
  );
}
