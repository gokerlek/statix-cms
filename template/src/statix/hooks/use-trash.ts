import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTranslation } from "@/statix/hooks/use-translation";
import { QUERY_KEYS } from "@/statix/lib/query-keys";

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
    queryKey: QUERY_KEYS.trash,
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
    mutationFn: async (selectedItems: TrashItem[]) => {
      const response = await fetch("/api/trash/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selectedItems.map((i) => ({ type: i.type, path: i.path })),
        }),
      });

      if (!response.ok) throw new Error("Failed to restore items");

      return response.json();
    },
    onMutate: async (selectedItems) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.trash });
      const previousTrash = queryClient.getQueryData<TrashItem[]>(QUERY_KEYS.trash);
      const paths = selectedItems.map((i) => i.path);

      if (previousTrash) {
        queryClient.setQueryData<TrashItem[]>(
          QUERY_KEYS.trash,
          previousTrash.filter((item) => !paths.includes(item.path)),
        );
      }

      return { previousTrash };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTrash) {
        queryClient.setQueryData(QUERY_KEYS.trash, context.previousTrash);
      }

      toast.error(t("toasts.error.globalMutation"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trash });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.media });
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
    mutationFn: async (selectedItems: TrashItem[]) => {
      const response = await fetch("/api/trash/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selectedItems.map((i) => ({ type: i.type, path: i.path })),
        }),
      });

      if (!response.ok) throw new Error("Failed to delete items");

      return response.json();
    },
    onMutate: async (selectedItems) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.trash });
      const previousTrash = queryClient.getQueryData<TrashItem[]>(QUERY_KEYS.trash);
      const paths = selectedItems.map((i) => i.path);

      if (previousTrash) {
        queryClient.setQueryData<TrashItem[]>(
          QUERY_KEYS.trash,
          previousTrash.filter((item) => !paths.includes(item.path)),
        );
      }

      return { previousTrash };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTrash) {
        queryClient.setQueryData(QUERY_KEYS.trash, context.previousTrash);
      }

      toast.error(t("toasts.error.delete"));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trash });
    },
    onSuccess: () => {
      toast.success(t("toasts.success.delete"));
    },
  });
}
