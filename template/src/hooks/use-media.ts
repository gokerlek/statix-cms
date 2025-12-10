import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import ui from "@/content/ui.json";
import { GitHubFile } from "@/lib/github-cms";

interface MediaFile extends GitHubFile {
  url: string;
  isOrphaned?: boolean;
}

export function useMedia() {
  return useQuery<MediaFile[]>({
    queryKey: ["media"],
    queryFn: async () => {
      const response = await fetch("/api/media/list");

      if (!response.ok) {
        throw new Error("Failed to fetch media");
      }

      return response.json();
    },
  });
}

export function useUploadMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      folder,
      filename,
    }: {
      file: File;
      folder?: string;
      filename?: string;
    }) => {
      const formData = new FormData();

      formData.append("file", file);

      if (folder) formData.append("folder", folder);

      if (filename) formData.append("filename", filename);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();

        throw new Error(error.error || ui.toasts.error.upload);
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success(ui.toasts.success.upload);
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ path, sha }: { path: string; sha: string }) => {
      const response = await fetch("/api/media/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ path, sha }),
      });

      if (!response.ok) {
        const error = await response.json();

        throw new Error(error.error || ui.toasts.error.delete);
      }

      return response.json();
    },
    onMutate: async ({ path }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["media"] });

      // Snapshot the previous value
      const previousMedia = queryClient.getQueryData<MediaFile[]>(["media"]);

      // Optimistically update to the new value
      if (previousMedia) {
        queryClient.setQueryData<MediaFile[]>(
          ["media"],
          previousMedia.filter((file) => file.path !== path),
        );
      }

      // Return a context object with the snapshotted value
      return { previousMedia };
    },
    onError: (err, newTodo, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousMedia) {
        queryClient.setQueryData(["media"], context.previousMedia);
      }

      toast.error(ui.toasts.error.delete);
    },
    onSettled: () => {
      // Always refetch after error or success:
      queryClient.invalidateQueries({ queryKey: ["media"] });
      queryClient.invalidateQueries({ queryKey: ["trash"] });
    },
    onSuccess: () => {
      toast.success(ui.toasts.success.delete);
    },
  });
}
