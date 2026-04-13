import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import ui from "@/statix/content/ui.json";
import { QUERY_KEYS } from "@/statix/lib/query-keys";
export interface MediaFile {
  [key: string]: unknown;
  name: string;
  path: string;
  sha: string;
  size: number;
  type: string;
  url: string;
  isOrphaned?: boolean;
  lastModified?: string;
}

export function useMedia() {
  return useQuery<MediaFile[]>({
    queryKey: QUERY_KEYS.media,
    queryFn: async () => {
      const response = await fetch("/api/media/list");

      if (!response.ok) {
        throw new Error("Failed to fetch media");
      }

      const data = await response.json();
      // R2'den gelen nesnelere sha ve type ekle (GitHubFile uyumluluğu için)
      return data.map((f: MediaFile) => ({
        ...f,
        sha: f.sha ?? f.path,
        type: f.type ?? "file",
      }));
    },
    staleTime: 1000 * 60, // 1 minute
    refetchOnWindowFocus: false,
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.media });
    },
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ path, url }: { path: string; url?: string; sha?: string }) => {
      const response = await fetch("/api/media/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: path, url }),
      });

      if (!response.ok) {
        const error = await response.json();

        throw new Error(error.error || ui.toasts.error.delete);
      }

      return response.json();
    },
    onMutate: async ({ path }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.media });

      // Snapshot the previous value
      const previousMedia = queryClient.getQueryData<MediaFile[]>(QUERY_KEYS.media);

      // Optimistically update to the new value
      if (previousMedia) {
        queryClient.setQueryData<MediaFile[]>(
          QUERY_KEYS.media,
          previousMedia.filter((file) => file.path !== path),
        );
      }

      // Return a context object with the snapshotted value
      return { previousMedia };
    },
    onError: (err, newTodo, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousMedia) {
        queryClient.setQueryData(QUERY_KEYS.media, context.previousMedia);
      }

      toast.error(ui.toasts.error.delete);
    },
    onSettled: () => {
      // Always refetch after error or success:
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.media });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trash });
    },
    onSuccess: () => {
      toast.success(ui.toasts.success.delete);
    },
  });
}
