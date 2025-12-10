import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTranslation } from "@/hooks/use-translation";

export interface TrashItem {
  name: string;
  path: string;
  originalPath: string;
  deletedAt: string;
  type: "collection_item" | "media";
}

export function useTrash() {
  useTranslation();

  return useQuery<TrashItem[]>({
    queryKey: ["trash"],
    queryFn: async () => {
      const response = await fetch("/api/trash/list");

      if (!response.ok) {
        throw new Error("Failed to fetch trash items");
      }

      return response.json();
    },
  });
}

export function useRestoreTrash() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (paths: string[]) => {
      const response = await fetch("/api/trash/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths }),
      });

      if (!response.ok) throw new Error("Failed to restore items");

      return response.json();
    },
    onMutate: async (paths) => {
      await queryClient.cancelQueries({ queryKey: ["trash"] });
      const previousTrash = queryClient.getQueryData<TrashItem[]>(["trash"]);

      if (previousTrash) {
        queryClient.setQueryData<TrashItem[]>(
          ["trash"],
          previousTrash.filter((item) => !paths.includes(item.path)),
        );
      }

      return { previousTrash };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousTrash) {
        queryClient.setQueryData(["trash"], context.previousTrash);
      }

      toast.error(t("toasts.error.globalMutation"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["trash"] });
      queryClient.invalidateQueries({ queryKey: ["media"] });
      queryClient.invalidateQueries({ queryKey: ["collection"] });
    },
    onSuccess: () => {
      toast.success(t("toasts.success.restored"));
    },
  });
}

export function useDeleteTrash() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  return useMutation({
    mutationFn: async (paths: string[]) => {
      const response = await fetch("/api/trash/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths }),
      });

      if (!response.ok) throw new Error("Failed to delete items");

      return response.json();
    },
    onMutate: async (paths) => {
      await queryClient.cancelQueries({ queryKey: ["trash"] });
      const previousTrash = queryClient.getQueryData<TrashItem[]>(["trash"]);

      if (previousTrash) {
        queryClient.setQueryData<TrashItem[]>(
          ["trash"],
          previousTrash.filter((item) => !paths.includes(item.path)),
        );
      }

      return { previousTrash };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousTrash) {
        queryClient.setQueryData(["trash"], context.previousTrash);
      }

      toast.error(t("toasts.error.delete"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["trash"] });
    },
    onSuccess: () => {
      toast.success(t("toasts.success.delete"));
    },
  });
}
