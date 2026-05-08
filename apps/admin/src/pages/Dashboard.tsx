import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, UserCheck, Shield, LayoutList } from "lucide-react";
import { useAdminStats } from "../hooks/use-admin";
import { useIsMobile } from "@/hooks/use-mobile";

const StatusBadge = ({ isActive }: { isActive: boolean }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold tracking-wide ${
        isActive
          ? "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400"
          : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-red-500"}`} />
      {isActive ? "Active" : "Disabled"}
    </span>
  );
};

const RoleBadge = ({ role }: { role: string }) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tracking-wide uppercase ${
        role === "admin"
          ? "bg-slate-900 text-slate-50 dark:bg-slate-100 dark:text-slate-900"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      {role}
    </span>
  );
};

export default function Dashboard() {
  const { data: stats, isLoading } = useAdminStats();
  const isMobile = useIsMobile();

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          Overview of your Kanban platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard title="Total Users" value={stats?.totalUsers} icon={Users} loading={isLoading} />
        <StatCard title="Active Users" value={stats?.activeUsers} icon={UserCheck} loading={isLoading} />
        <StatCard title="Admins" value={stats?.adminCount} icon={Shield} loading={isLoading} />
        <StatCard title="Total Boards" value={stats?.totalBoards} icon={LayoutList} loading={isLoading} />
      </div>

      {/* Recent Users */}
      <Card className="rounded-xl border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/50">
          <CardTitle className="text-base font-semibold">Recent Users</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            /* Custom realistic skeletons */
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24 sm:w-32" />
                      <Skeleton className="h-3 w-32 sm:w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full hidden sm:block" />
                </div>
              ))}
            </div>
          ) : isMobile ? (
            /* Mobile: stacked cards */
            <div className="space-y-4">
              {stats?.recentUsers?.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random`}
                      alt="avatar"
                      className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate text-slate-900 dark:text-slate-100">{user.displayName}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
                    <StatusBadge isActive={user.isActive} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Desktop: table */
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.recentUsers?.map((user) => (
                  <TableRow key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random`}
                          alt="avatar"
                          className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{user.displayName}</p>
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
                    <TableCell className="text-right text-slate-500 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string;
  value?: number;
  icon: any;
  loading: boolean;
}) {
  return (
    <Card className="rounded-xl border-slate-200 dark:border-slate-800 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-200 group">
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs md:text-sm font-medium text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
              {title}
            </p>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                {value ?? 0}
              </p>
            )}
          </div>
          <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <Icon className="h-5 w-5 md:h-6 md:w-6 text-slate-600 dark:text-slate-300 group-hover:text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
