"use client";

import { useState, useEffect } from "react";
import { LayoutDashboard, Settings, HelpCircle, LogOut, ChevronsUpDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser, useLogout } from "../hooks/use-auth";
import { useBoards } from "../hooks/use-kanban";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SidebarNav({ onNavigate, isCollapsed = false }: { onNavigate?: () => void; isCollapsed?: boolean }) {
  const { data: user } = useCurrentUser();
  const { data: boardsData } = useBoards();
  const logout = useLogout();
  const pathname = usePathname();

  const boards = boardsData?.items ?? [];

  return (
    <div className="flex flex-col h-full w-full">
      <div className="px-3 flex-1 overflow-y-auto">
        <div className="mb-8">
          {!isCollapsed && (
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest px-4 mb-2">
              Projects
            </p>
          )}
          <div className="space-y-1">
            {boards.map((board) => (
              <Link
                key={board.id}
                href={`/?boardId=${board.id}`}
                onClick={onNavigate}
                className={cn(
                  "w-full flex items-center rounded-xl text-sm transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
                  isCollapsed ? "justify-center py-3" : "gap-3 px-4 py-2.5"
                )}
                title={isCollapsed ? board.title : undefined}
              >
                <LayoutDashboard size={18} className="shrink-0" />
                {!isCollapsed && <span className="truncate">{board.title}</span>}
              </Link>
            ))}
            {boards.length === 0 && !isCollapsed && (
              <p className="px-4 text-xs text-muted-foreground">No boards yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="px-3 pb-4">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "w-full flex items-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isCollapsed ? "justify-center py-2 px-0" : "gap-3 px-3 py-2.5"
              )}>
                <img
                  src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.displayName}`}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover shrink-0"
                />
                {!isCollapsed && (
                  <>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate text-slate-900 dark:text-slate-100">
                        {user.displayName}
                      </p>
                      <p className="text-[10px] text-slate-500 tracking-tight truncate">
                        {user.email}
                      </p>
                    </div>
                    <ChevronsUpDown size={16} className="text-slate-400 shrink-0" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="center"
              className="w-[220px] rounded-xl mb-2"
            >
              <DropdownMenuItem asChild>
                <Link
                  href="/settings"
                  onClick={onNavigate}
                  className="w-full cursor-pointer flex items-center"
                >
                  <Settings className="mr-2 h-4 w-4 text-slate-500" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onNavigate}
                className="cursor-pointer flex items-center"
              >
                <HelpCircle className="mr-2 h-4 w-4 text-slate-500" />
                <span>Help & Feedback</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  onNavigate?.();
                  logout.mutate();
                }}
                className="cursor-pointer flex items-center text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{logout.isPending ? "Logging out..." : "Log out"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="h-[52px] animate-pulse bg-slate-100 dark:bg-slate-800 rounded-xl" />
        )}
      </div>
    </div>
  );
}

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Load preference from localStorage
    const savedState = localStorage.getItem("lazuar-sidebar-collapsed");
    if (savedState !== null) {
      setIsCollapsed(savedState === "true");
    }

    // Delay adding the CSS transition classes by a fraction of a second.
    // This prevents the sidebar from "sliding" into its collapsed state on initial page load.
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const toggleCollapse = () => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    localStorage.setItem("lazuar-sidebar-collapsed", String(newValue));
  };

  return (
    <aside className={cn(
      "hidden md:flex bg-white dark:bg-background border-r border-slate-200 dark:border-border flex-col shrink-0",
      isMounted ? "transition-all duration-300" : "", // Only animate after initial mount
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Aligned height (h-16) to cleanly match the TopNav's vertical space */}
      <div className={cn(
        "h-16 flex items-center shrink-0 mb-2 overflow-hidden",
        isCollapsed ? "justify-center px-0" : "px-6 justify-between"
      )}>
        {!isCollapsed && <h1 className="text-lg font-bold tracking-tight whitespace-nowrap">Lazuar</h1>}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 shrink-0" onClick={toggleCollapse}>
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </Button>
      </div>
      <SidebarNav isCollapsed={isCollapsed} />
    </aside>
  );
}
