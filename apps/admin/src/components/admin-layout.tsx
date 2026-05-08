import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authMe, authLogout } from "@repo/api-types";
import { client } from "../lib/api";
import { ThemeToggle } from "./theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Users,
  LayoutList,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/users", icon: Users, label: "Users" },
  { to: "/boards", icon: LayoutList, label: "Boards" },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sidebar Collapsible State
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const savedState = localStorage.getItem("lazuar-admin-sidebar-collapsed");
    if (savedState !== null) {
      setIsCollapsed(savedState === "true");
    }
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const toggleCollapse = () => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    localStorage.setItem("lazuar-admin-sidebar-collapsed", String(newValue));
  };

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data, error } = await authMe({ client });
      if (error) throw new Error("Not authenticated");
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleLogout = async () => {
    await authLogout({ client });
    queryClient.clear();
    navigate("/login");
  };

  // Determine current page title for breadcrumb
  const currentPageTitle =
    navItems.find((item) => item.to === location.pathname)?.label || "Dashboard";

  // Shared Sidebar Content (used in both Desktop <aside> and Mobile <Sheet>)
  const SidebarContent = ({
    onNavigate,
    isSidebarCollapsed = false,
    onToggle,
  }: {
    onNavigate?: () => void;
    isSidebarCollapsed?: boolean;
    onToggle?: () => void;
  }) => (
    <div className="flex flex-col h-full w-full">
      {/* Header / Branding */}
      <div className={cn(
        "h-16 flex items-center shrink-0 mb-2 overflow-hidden",
        isSidebarCollapsed ? "justify-center px-0" : "px-6 justify-between"
      )}>
        {!isSidebarCollapsed && (
          <h1 className="text-lg font-bold tracking-tight whitespace-nowrap">Lazuar Admin</h1>
        )}
        {onToggle && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 shrink-0" onClick={onToggle}>
            {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div className="px-3 flex-1 overflow-y-auto">
        <div className="mb-8">
          {!isSidebarCollapsed && (
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest px-4 mb-2">
              Management
            </p>
          )}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={onNavigate}
                title={isSidebarCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    "w-full flex items-center rounded-xl text-sm transition-all",
                    isActive
                      ? "bg-slate-100 text-slate-900 font-semibold dark:bg-slate-800 dark:text-white"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
                    isSidebarCollapsed ? "justify-center py-3" : "gap-3 px-4 py-2.5"
                  )
                }
              >
                <item.icon className={cn("shrink-0", isSidebarCollapsed ? "h-5 w-5" : "h-4 w-4")} />
                {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-background selection:bg-slate-200">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:flex bg-white dark:bg-background border-r border-slate-200 dark:border-border flex-col shrink-0",
        isMounted ? "transition-all duration-300" : "", // Only animate after initial mount
        isCollapsed ? "w-20" : "w-64"
      )}>
        <SidebarContent isSidebarCollapsed={isCollapsed} onToggle={toggleCollapse} />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Persistent Top Nav */}
        <header className="h-16 bg-white dark:bg-background border-b border-slate-200 dark:border-border flex items-center justify-between px-4 md:px-6 shrink-0">
          {/* Left Side: Mobile Menu Trigger & Breadcrumbs */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile Hamburger */}
            <div className="md:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2 text-slate-500">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0 flex flex-col">
                  {/* Accessibility Header */}
                  <SheetHeader className="sr-only">
                    <SheetTitle>Navigation Menu</SheetTitle>
                    <SheetDescription>Access the admin navigation links</SheetDescription>
                  </SheetHeader>
                  <SidebarContent onNavigate={() => setMobileOpen(false)} isSidebarCollapsed={false} />
                </SheetContent>
              </Sheet>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center text-sm text-slate-500 font-medium">
              <span className="hidden sm:inline hover:text-slate-700 transition-colors cursor-pointer">
                Admin Workspace
              </span>
              <span className="hidden sm:inline text-slate-300 dark:text-slate-600 mx-2">/</span>
              <span className="text-slate-900 dark:text-slate-100 font-bold truncate">
                {currentPageTitle}
              </span>
            </div>
          </div>

          {/* Right Side: Theme Toggle & User Profile */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <ThemeToggle />

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary hover:opacity-80 transition-opacity">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      user?.displayName || "Admin"
                    )}&background=random`}
                    alt={user?.displayName}
                    className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover shrink-0"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl mt-1">
                <div className="px-2 py-2">
                  <p className="text-sm font-semibold truncate text-slate-900 dark:text-slate-100">
                    {user?.displayName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  <Badge variant="secondary" className="w-fit text-[10px] mt-2 uppercase tracking-wide">
                    {user?.role}
                  </Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
