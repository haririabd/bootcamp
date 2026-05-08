import { useMutation, useQueryClient } from "@tanstack/react-query";
import { columnsCreate, columnsUpdate, columnsDelete } from "@repo/api-types";
import { client } from "../lib/api";
import { toast } from "sonner";

export function useCreateColumn(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title }: { title: string }) => {
      const { data, error } = await columnsCreate({
        client,
        path: { boardId },
        body: { title },
      });
      if (error) {
        const err = new Error("Failed to create column");
        (err as any).status = (error as any)?.status;
        (err as any).detail = error;
        throw err;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      toast.success("Column created.");
    },
    onError: (error: any) => {
      if (error?.status === 400 && error?.detail?.message) {
        toast.error(error.detail.message);
      } else {
        toast.error("Failed to create column.");
      }
    },
  });
}

export function useUpdateColumn(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      columnId,
      title,
      position,
    }: {
      columnId: string;
      title?: string;
      position?: number;
    }) => {
      const { data, error } = await columnsUpdate({
        client,
        path: { boardId, columnId },
        body: { title, position },
      });
      if (error) {
        const err = new Error("Failed to update column");
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
        toast.warning("Column was modified. Refreshing...");
      } else {
        toast.error("Failed to update column.");
      }
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
  });
}

export function useDeleteColumn(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ columnId }: { columnId: string }) => {
      const { error } = await columnsDelete({
        client,
        path: { boardId, columnId },
      });
      if (error) {
        const err = new Error("Failed to delete column");
        (err as any).status = (error as any)?.status;
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board", boardId] });
      toast.success("Column deleted.");
    },
    onError: () => {
      toast.error("Failed to delete column.");
    },
  });
}
