import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminUpdateUserStatus, adminUpdateUserRole } from "@repo/api-types";
import { client } from "../lib/api";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface BoardItem {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  adminCount: number;
  totalBoards: number;
  recentUsers: AdminUser[];
}

// ─── Stats ──────────────────────────────────────────────────────

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const response = await fetch("/api/admin/stats", {
        credentials: "include",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (!response.ok) {
        const err = new Error("Failed to fetch stats");
        (err as any).status = response.status;
        throw err;
      }
      return response.json() as Promise<AdminStats>;
    },
    staleTime: 30 * 1000,
  });
}

// ─── Users ──────────────────────────────────────────────────────

export function useAdminUsers(page = 1, pageSize = 20, search = "") {
  return useQuery({
    queryKey: ["admin-users", page, pageSize, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });
      if (search) params.set("search", search);

      const response = await fetch(`/api/admin/users?${params}`, {
        credentials: "include",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (!response.ok) {
        const err = new Error("Failed to fetch users");
        (err as any).status = response.status;
        throw err;
      }
      return response.json() as Promise<PaginatedResponse<AdminUser>>;
    },
  });
}

export function useToggleUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await adminUpdateUserStatus({
        client,
        path: { userId: id },
        body: { isActive: !isActive },
      });
      if (error) {
        const err = new Error("Failed to update status");
        (err as any).status = (error as any)?.status;
        (err as any).detail = error;
        throw err;
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success(`${data?.displayName} is now ${data?.isActive ? "active" : "disabled"}.`);
    },
    onError: (error: any) => {
      if (error?.detail?.message) toast.error(error.detail.message);
      else toast.error("Failed to update status.");
    },
  });
}

export function useToggleUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, currentRole }: { id: string; currentRole: string }) => {
      const newRole = currentRole === "admin" ? "user" : "admin";
      const { data, error } = await adminUpdateUserRole({
        client,
        path: { userId: id },
        body: { role: newRole },
      });
      if (error) {
        const err = new Error("Failed to update role");
        (err as any).status = (error as any)?.status;
        (err as any).detail = error;
        throw err;
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success(`${data?.displayName}'s role updated to ${data?.role}.`);
    },
    onError: (error: any) => {
      if (error?.detail?.message) toast.error(error.detail.message);
      else toast.error("Failed to update role.");
    },
  });
}

// ─── Boards ─────────────────────────────────────────────────────

export function useAdminBoards(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["admin-boards", page, pageSize],
    queryFn: async () => {
      const response = await fetch(`/api/boards?page=${page}&pageSize=${pageSize}`, {
        credentials: "include",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (!response.ok) {
        const err = new Error("Failed to fetch boards");
        (err as any).status = response.status;
        throw err;
      }
      return response.json() as Promise<PaginatedResponse<BoardItem>>;
    },
  });
}

export function useDeleteBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (boardId: string) => {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });
      if (!response.ok) {
        const err = new Error("Failed to delete board");
        (err as any).status = response.status;
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-boards"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Board deleted.");
    },
    onError: () => {
      toast.error("Failed to delete board.");
    },
  });
}
