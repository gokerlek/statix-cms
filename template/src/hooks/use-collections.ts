import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import ui from "@/content/ui.json";
import { GitHubFile } from "@/lib/github-cms";

export function useCollectionItems(slug: string, initialData?: GitHubFile[]) {
  return useQuery<GitHubFile[]>({
    queryKey: ["collection", slug],
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
      await queryClient.cancelQueries({ queryKey: ["collection", slug] });

      const previousItems = queryClient.getQueryData<GitHubFile[]>([
        "collection",
        slug,
      ]);

      if (previousItems) {
        queryClient.setQueryData<GitHubFile[]>(
          ["collection", slug],
          previousItems.filter((item) => item.name.replace(".json", "") !== id),
        );
      }

      return { previousItems };
    },
    onError: (err, newTodo, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(["collection", slug], context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["collection", slug] });
      queryClient.invalidateQueries({ queryKey: ["trash"] });
    },
    onSuccess: () => {
      toast.success(ui.toasts.success.collectionItemDeleted);
    },
  });
}
