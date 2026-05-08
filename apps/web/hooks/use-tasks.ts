import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tasksCreate, tasksUpdate, tasksDelete, tasksMove } from "@repo/api-types";
import type { components } from "@repo/api-types";
import { client } from "../lib/api";
import { toast } from "sonner";

type BoardDetail = components["schemas"]["BoardDetail"];

export function useCreateTask(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      columnId,
      title,
      priority,
      tags,
      dueDate
    }: {
      columnId: string;
      title: string;
      priority?: string;
      tags?: string[];
      dueDate?: string;
    }) => {
      const { data, error } = await tasksCreate({
        client,
        path: { columnId },
        body: { title, priority, tags, dueDate },
      });
      if (error) {
        const err = new Error("Failed to create task");
        (err as any).status = (error as any)?.status;
        (err as any).detail = error;
        throw err;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      toast.success("Task created.");
    },
    onError: (error: any) => {
      if (error?.status === 400 && error?.detail?.message) {
        toast.error(error.detail.message);
      } else {
        toast.error("Failed to create task.");
      }
    },
  });
}

export function useUpdateTask(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      columnId,
      taskId,
      title,
      description,
      assigneeId,
      priority,
      tags,
      dueDate,
    }: {
      columnId: string;
      taskId: string;
      title?: string;
      description?: string;
      assigneeId?: string;
      priority?: string;
      tags?: string[];
      dueDate?: string;
    }) => {
      const { data, error } = await tasksUpdate({
        client,
        path: { columnId, taskId },
        body: { title, description, assigneeId, priority, tags, dueDate },
      });
      if (error) {
        const err = new Error("Failed to update task");
        (err as any).status = (error as any)?.status;
        throw err;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
    onError: (error: any) => {
      if (error?.status === 409) {
        toast.warning("Task was modified. Refreshing...");
      } else {
        toast.error("Failed to update task.");
      }
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
  });
}

export function useDeleteTask(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ columnId, taskId }: { columnId: string; taskId: string }) => {
      const { error } = await tasksDelete({
        client,
        path: { columnId, taskId },
      });
      if (error) {
        const err = new Error("Failed to delete task");
        (err as any).status = (error as any)?.status;
        throw err;
      }
    },
    onMutate: async ({ columnId, taskId }) => {
      await queryClient.cancelQueries({ queryKey: ["board", boardId] });
      const previousBoard = queryClient.getQueryData<BoardDetail>(["board", boardId]);

      // Optimistic removal
      if (previousBoard) {
        queryClient.setQueryData(["board", boardId], {
          ...previousBoard,
          columns: previousBoard.columns.map((col) =>
            col.id === columnId
              ? { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) }
              : col
          ),
        });
      }

      return { previousBoard };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousBoard) {
        queryClient.setQueryData(["board", boardId], context.previousBoard);
      }
      toast.error("Failed to delete task.");
    },
    onSuccess: () => {
      toast.success("Task deleted.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
  });
}

export function useMoveTask(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      columnId,
      taskId,
      targetColumnId,
      position,
    }: {
      columnId: string;
      taskId: string;
      targetColumnId: string;
      position: number;
    }) => {
      const { data, error } = await tasksMove({
        client,
        path: { columnId, taskId },
        body: { targetColumnId, position },
      });
      if (error) {
        const err = new Error("Failed to move task");
        (err as any).status = (error as any)?.status;
        throw err;
      }
      return data;
    },
    onMutate: async () => {
      // Cancel any in-flight board fetches to prevent them overwriting our optimistic state
      await queryClient.cancelQueries({ queryKey: ["board", boardId] });
      const previousBoard = queryClient.getQueryData<BoardDetail>(["board", boardId]);
      return { previousBoard };
    },
    onError: (_error: any, _variables, context) => {
      // Rollback on failure
      if (context?.previousBoard) {
        queryClient.setQueryData(["board", boardId], context.previousBoard);
      }
      toast.error("Failed to move task.");
      // Only refetch on error to get correct server state
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
    // SUCCESS: Do NOT invalidate. The optimistic state from onDragOver is already correct.
    // This prevents the flash/lag of re-rendering with server data.
    // SignalR will broadcast a BoardUpdated event to OTHER clients, but we don't need a hard refetch.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId], refetchType: "none" });
    },
  });
}

// ─── Comments & Attachments ─────────────────────────────────────

export function useComments(columnId: string, taskId: string) {
  return useQuery({
    queryKey: ["comments", taskId],
    queryFn: async () => {
      if (!columnId || !taskId) return [];
      const res = await fetch(`/api/columns/${columnId}/tasks/${taskId}/comments`, {
        headers: { "X-Requested-With": "XMLHttpRequest" }
      });
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
    enabled: !!taskId,
  });
}

export function useAddComment(columnId: string, taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch(`/api/columns/${columnId}/tasks/${taskId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error("Failed to add comment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
      queryClient.invalidateQueries({ queryKey: ["board"] }); // Updates comment count indicator
      toast.success("Comment added.");
    },
    onError: () => toast.error("Failed to post comment.")
  });
}

export function useUploadAttachment(columnId: string, taskId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/columns/${columnId}/tasks/${taskId}/attachments`, {
        method: "POST",
        body: formData,
        headers: { "X-Requested-With": "XMLHttpRequest" } // required for CSRF protection middleware
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Upload failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("File uploaded successfully.");
      queryClient.invalidateQueries({ queryKey: ["board"] }); // Updates attachment count indicator
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to upload file.");
    }
  });
}
