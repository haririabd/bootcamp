"use client";

import { ChevronsUpDown, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Board {
  id: string;
  title: string;
}

interface BoardSwitcherProps {
  boards: Board[];
  currentBoardId: string;
  onSwitch: (boardId: string) => void;
}

export function BoardSwitcher({ boards, currentBoardId, onSwitch }: BoardSwitcherProps) {
  const currentBoard = boards.find((b) => b.id === currentBoardId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {/* Changed variant to ghost and boosted the typography to look like a header */}
        <Button
          variant="ghost"
          className="gap-2 max-w-[240px] text-base font-bold px-2 border-0 shadow-none hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100"
        >
          <LayoutDashboard className="h-4 w-4 shrink-0 text-slate-500" />
          <span className="truncate">{currentBoard?.title ?? "Select Board"}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50 text-slate-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[220px] rounded-xl">
        <DropdownMenuLabel>Your Boards</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {boards.map((board) => (
          <DropdownMenuItem
            key={board.id}
            onClick={() => onSwitch(board.id)}
            className={board.id === currentBoardId ? "bg-accent" : ""}
          >
            <LayoutDashboard className="mr-2 h-4 w-4 text-slate-400" />
            <span className="truncate">{board.title}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
