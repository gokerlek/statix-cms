import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import ui from "@/statix/content/ui.json";
import { GitHubFile } from "@/statix/lib/github-cms";
import { QUERY_KEYS } from "@/statix/lib/query-keys";

export function useCollectionItems(slug: string, initialData?: GitHubFile[]) {
  return useQuery<GitHubFile[]>({
    queryKey: QUERY_KEYS.collection(slug),
    queryFn: async () => {
      const response = await fetch(`/api/collections/${slug}`);

      if (!response.ok) {
        throw new Error("Failed to fetch collection items");
      }

      return response.json();
    },
    initialData,
  });
}

export function useDeleteCollectionItem(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const response = await fetch(`/api/delete/${slug}/${id}`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();

        throw new Error(error.error || ui.toasts.error.collectionItemDelete);
      }

      return response.json();
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.collection(slug) });

      const previousItems = queryClient.getQueryData<GitHubFile[]>(
        QUERY_KEYS.collection(slug),
      );

      if (previousItems) {
        queryClient.setQueryData<GitHubFile[]>(
          QUERY_KEYS.collection(slug),
          previousItems.filter((item) => item.name.replace(".json", "") !== id),
        );
      }

      return { previousItems };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(QUERY_KEYS.collection(slug), context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.collection(slug) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trash });
    },
    onSuccess: () => {
      toast.success(ui.toasts.success.collectionItemDeleted);
    },
  });
}
