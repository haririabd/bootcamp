import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { authMe } from "@repo/api-types";
import { client } from "../lib/api";
import { useAdminUsers, useToggleUserStatus, useToggleUserRole } from "../hooks/use-admin";
import { ConfirmDialog } from "../components/confirm-dialog";
import { MobileCard } from "../components/mobile-card-view";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldOff,
  UserCheck,
  UserX,
  X,
  Users as UsersIcon,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const StatusBadge = ({ isActive }: { isActive: boolean }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold tracking-wide ${isActive ? "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400" : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"}`}>
    <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`} />
    {isActive ? "Active" : "Disabled"}
  </span>
);

const RoleBadge = ({ role }: { role: string }) => (
  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tracking-wide uppercase ${role === "admin" ? "bg-slate-900 text-slate-50 dark:bg-slate-100 dark:text-slate-900" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
    {role}
  </span>
);

export default function Users() {
  const isMobile = useIsMobile();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [confirmAction, setConfirmAction] = useState<{
    type: "role" | "status";
    userId: string;
    userName: string;
    currentValue: string | boolean;
  } | null>(null);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data, error } = await authMe({ client });
      if (error) throw error;
      return data;
    },
  });

  const { data, isLoading, isError, refetch } = useAdminUsers(page, pageSize, search);
  const toggleStatus = useToggleUserStatus();
  const toggleRole = useToggleUserRole();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === "role") {
      toggleRole.mutate({ id: confirmAction.userId, currentRole: confirmAction.currentValue as string });
    } else {
      toggleStatus.mutate({ id: confirmAction.userId, isActive: confirmAction.currentValue as boolean });
    }
    setConfirmAction(null);
  };

  const UserActions = ({ user }: { user: any }) => {
    const isSelf = user.id === me?.id;
    if (isSelf) return null;

    return (
      <>
        <DropdownMenuItem
          onClick={() => setConfirmAction({
            type: "role",
            userId: user.id,
            userName: user.displayName,
            currentValue: user.role,
          })}
          className="cursor-pointer"
        >
          {user.role === "admin" ? (
            <><ShieldOff className="mr-2 h-4 w-4" />Demote to User</>
          ) : (
            <><ShieldCheck className="mr-2 h-4 w-4" />Promote to Admin</>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setConfirmAction({
            type: "status",
            userId: user.id,
            userName: user.displayName,
            currentValue: user.isActive,
          })}
          className={`cursor-pointer ${user.isActive ? "text-destructive focus:text-destructive" : ""}`}
        >
          {user.isActive ? (
            <><UserX className="mr-2 h-4 w-4" />Disable Account</>
          ) : (
            <><UserCheck className="mr-2 h-4 w-4" />Enable Account</>
          )}
        </DropdownMenuItem>
      </>
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage platform users, roles, and access
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search users..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 rounded-xl border-slate-200 dark:border-slate-800"
          />
        </div>
        <Button type="submit" variant="secondary" className="rounded-xl shadow-sm">
          Search
        </Button>
        {search && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </form>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32 md:w-48" />
                  <Skeleton className="h-3 w-48 md:w-64" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full hidden sm:block shrink-0" />
                <Skeleton className="h-6 w-20 rounded-full hidden md:block shrink-0" />
                <Skeleton className="h-8 w-8 rounded-lg shrink-0 hidden sm:block" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="text-center py-8 space-y-2 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
          <p className="text-destructive font-medium">Failed to load users</p>
          <Button onClick={() => refetch()} size="sm" variant="outline" className="rounded-lg">Retry</Button>
        </div>
      )}

      {/* Data */}
      {data && (
        <>
          {/* Mobile: Card view */}
          {isMobile ? (
            <div className="space-y-3">
              {data.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                    <UsersIcon className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">No users found</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-[250px]">Try adjusting your search criteria.</p>
                </div>
              ) : (
                data.items.map((user) => {
                  const isSelf = user.id === me?.id;
                  return (
                    <MobileCard
                      key={user.id}
                      actions={!isSelf ? <UserActions user={user} /> : undefined}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random`}
                          alt="avatar"
                          className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold truncate">{user.displayName}</p>
                            {isSelf && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md font-medium">YOU</span>}
                          </div>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <RoleBadge role={user.role} />
                        <StatusBadge isActive={user.isActive} />
                      </div>
                    </MobileCard>
                  );
                })
              )}
            </div>
          ) : (
            /* Desktop: Table view inside a card container */
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((user) => {
                    const isSelf = user.id === me?.id;
                    return (
                      <TableRow key={user.id} className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isSelf ? "bg-slate-50/50 dark:bg-slate-800/30" : ""}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random`}
                              alt="avatar"
                              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                            />
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-100">
                                {user.displayName}
                                {isSelf && <span className="ml-2 text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-md font-medium">YOU</span>}
                              </p>
                              <p className="text-sm text-slate-500">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <RoleBadge role={user.role} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge isActive={user.isActive} />
                        </TableCell>
                        <TableCell className="text-slate-500 text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {!isSelf && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                                <UserActions user={user} />
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {data.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-[300px] text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                            <UsersIcon className="h-8 w-8 text-slate-400" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No users found</h3>
                          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                            We couldn't find any users matching your criteria. Try adjusting your search.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs sm:text-sm text-slate-500">
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data.totalCount)} of {data.totalCount}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!data.hasPreviousPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium tabular-nums">
                  {page} / {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!data.hasNextPage}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={
          confirmAction?.type === "role"
            ? `Change ${confirmAction.userName}'s role?`
            : confirmAction?.currentValue
              ? `Disable ${confirmAction?.userName}?`
              : `Enable ${confirmAction?.userName}?`
        }
        description={
          confirmAction?.type === "role"
            ? `Role will change from "${confirmAction.currentValue}" to "${confirmAction.currentValue === "admin" ? "user" : "admin"}".`
            : confirmAction?.currentValue
              ? "They will no longer be able to sign in."
              : "They will be able to sign in again."
        }
        confirmLabel={confirmAction?.type === "role" ? "Change Role" : (confirmAction?.currentValue ? "Disable" : "Enable")}
        variant={confirmAction?.type === "status" && confirmAction?.currentValue ? "destructive" : "default"}
        onConfirm={handleConfirm}
        loading={toggleStatus.isPending || toggleRole.isPending}
      />
    </div>
  );
}
