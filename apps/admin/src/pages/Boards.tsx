import { useState } from "react";
import { useAdminBoards, useDeleteBoard } from "../hooks/use-admin";
import { ConfirmDialog } from "../components/confirm-dialog";
import { MobileCard } from "../components/mobile-card-view";
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
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Trash2, ChevronLeft, ChevronRight, LayoutDashboard } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Boards() {
  const isMobile = useIsMobile();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [deleteBoard, setDeleteBoard] = useState<{ id: string; title: string } | null>(null);

  const { data, isLoading, isError, refetch } = useAdminBoards(page, pageSize);
  const deleteBoardMutation = useDeleteBoard();

  const BoardActions = ({ board }: { board: any }) => (
    <>
      <DropdownMenuItem
        onClick={() => setDeleteBoard({ id: board.id, title: board.title })}
        className="text-destructive focus:text-destructive cursor-pointer rounded-lg"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete Board
      </DropdownMenuItem>
    </>
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Boards</h1>
        <p className="text-slate-500 text-sm mt-1">
          View and manage all boards across the platform
        </p>
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 space-y-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-6 w-6 rounded-md shrink-0 hidden sm:block" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32 md:w-48" />
                  <Skeleton className="h-3 w-48 md:w-64" />
                </div>
                <Skeleton className="h-6 w-24 rounded-md hidden sm:block shrink-0" />
                <Skeleton className="h-4 w-20 hidden md:block shrink-0" />
                <Skeleton className="h-8 w-8 rounded-lg shrink-0 hidden sm:block" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="text-center py-8 space-y-2 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
          <p className="text-destructive font-medium">Failed to load boards</p>
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
                    <LayoutDashboard className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">No boards found</h3>
                  <p className="text-sm text-slate-500 mt-1 max-w-[250px]">There are currently no boards on the platform.</p>
                </div>
              ) : (
                data.items.map((board) => (
                  <MobileCard key={board.id} actions={<BoardActions board={board} />}>
                    <div className="flex items-center gap-2 mb-1">
                      <LayoutDashboard className="h-4 w-4 text-slate-400" />
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{board.title}</p>
                    </div>
                    {board.description && (
                      <p className="text-xs text-slate-500 line-clamp-1">{board.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md">
                        Owner: {board.ownerId.slice(0, 8)}…
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(board.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </MobileCard>
                ))
              )}
            </div>
          ) : (
            /* Desktop: Table view inside rounded container */
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Title</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Owner ID</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((board) => (
                    <TableRow key={board.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <TableCell className="font-semibold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <LayoutDashboard className="h-4 w-4 text-slate-400" />
                          {board.title}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm max-w-[250px] truncate">
                        {board.description || "—"}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md">
                          {board.ownerId.slice(0, 8)}…
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {new Date(board.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {new Date(board.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/10 transition-colors"
                          onClick={() => setDeleteBoard({ id: board.id, title: board.title })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-[300px] text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                            <LayoutDashboard className="h-8 w-8 text-slate-400" />
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No boards found</h3>
                          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                            It looks like there aren't any boards available yet.
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
                  {page}/{data.totalPages}
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

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteBoard}
        onOpenChange={(open) => !open && setDeleteBoard(null)}
        title="Delete Board"
        description={`Are you sure you want to delete "${deleteBoard?.title}"? All columns and tasks will be permanently removed.`}
        confirmLabel="Delete Board"
        variant="destructive"
        onConfirm={() => {
          if (deleteBoard) {
            deleteBoardMutation.mutate(deleteBoard.id);
            setDeleteBoard(null);
          }
        }}
        loading={deleteBoardMutation.isPending}
      />
    </div>
  );
}
