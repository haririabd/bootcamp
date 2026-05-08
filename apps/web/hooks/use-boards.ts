import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { boardsGet, boardsCreate, boardsUpdate, boardsDelete } from "@repo/api-types";
import { client } from "../lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PaginatedBoards {
  items: Array<{
    id: string;
    title: string;
    description?: string;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
  }>;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function useBoards(page = 1, pageSize = 50) {
  return useQuery({
    queryKey: ["boards", page, pageSize],
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
      return response.json() as Promise<PaginatedBoards>;
    },
  });
}

export function useBoard(boardId: string) {
  return useQuery({
    queryKey: ["board", boardId],
    queryFn: async () => {
      const { data, error } = await boardsGet({ client, path: { boardId } });
      if (error) {
        const err = new Error("Failed to fetch board");
        (err as any).status = (error as any)?.status;
        throw err;
      }
      return data;
    },
    enabled: !!boardId,
  });
}

export function useCreateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, description }: { title: string; description?: string }) => {
      const { data, error } = await boardsCreate({
        client,
        body: { title, description },
      });
      if (error) {
        const err = new Error("Failed to create board");
        (err as any).status = (error as any)?.status;
        (err as any).detail = error;
        throw err;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      toast.success("Board created!");
    },
    onError: (error: any) => {
      if (error?.status === 400 && error?.detail?.message) {
        toast.error(error.detail.message);
      } else {
        toast.error("Failed to create board. Please try again.");
      }
    },
  });
}

export function useUpdateBoard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      boardId,
      title,
      description,
    }: {
      boardId: string;
      title?: string;
      description?: string;
    }) => {
      const { data, error } = await boardsUpdate({
        client,
        path: { boardId },
        body: { title, description },
      });
      if (error) {
        const err = new Error("Failed to update board");
        (err as any).status = (error as any)?.status;
        throw err;
      }
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      queryClient.invalidateQueries({ queryKey: ["board", variables.boardId] });
      toast.success("Board updated.");
    },
    onError: (error: any) => {
      if (error?.status === 409) {
        toast.warning("Board was modified by someone else. Refreshing...");
      } else {
        toast.error("Failed to update board.");
      }
    },
  });
}

export function useDeleteBoard() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ boardId }: { boardId: string }) => {
      const { error } = await boardsDelete({
        client,
        path: { boardId },
      });
      if (error) {
        const err = new Error("Failed to delete board");
        (err as any).status = (error as any)?.status;
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boards"] });
      toast.success("Board deleted.");
      router.refresh();
    },
    onError: () => {
      toast.error("Failed to delete board.");
    },
  });
}

// ─── Board Members (Collaboration) ──────────────────────────────

export function useAddBoardMember(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role?: string }) => {
      const res = await fetch(`/api/boards/${boardId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: JSON.stringify({ userId, role: role ?? "editor" })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const err = new Error("Failed to add member");
        (err as any).status = res.status;
        (err as any).detail = errorData;
        throw err;
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      toast.success("Member added.");
    },
    onError: (error: any) => {
      toast.error(error?.detail?.message || "Failed to add member.");
    }
  });
}

export function useRemoveBoardMember(boardId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/boards/${boardId}/members/${userId}`, {
        method: "DELETE",
        headers: { "X-Requested-With": "XMLHttpRequest" }
      });
      if (!res.ok) {
        throw new Error("Failed to remove member");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      toast.success("Member removed.");
    },
    onError: () => toast.error("Failed to remove member.")
  });
}
