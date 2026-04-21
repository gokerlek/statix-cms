import { type InfiniteData, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

interface MediaPage {
  items: MediaFile[];
  nextCursor: string | null;
}

export function useMedia() {
  return useInfiniteQuery<MediaPage, Error, InfiniteData<MediaPage>, typeof QUERY_KEYS.media, string | null>({
    queryKey: QUERY_KEYS.media,
    queryFn: async ({ pageParam }) => {
      const url = pageParam
        ? `/api/media/list?cursor=${encodeURIComponent(pageParam)}`
        : "/api/media/list";

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch media");
      }

      const data: MediaPage = await response.json();
      return {
        ...data,
        items: data.items.map((f) => ({
          ...f,
          sha: (f.sha as string | undefined) ?? f.path,
          type: (f.type as string | undefined) ?? "file",
        })),
      };
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60,
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
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.media });

      const previousMedia = queryClient.getQueryData<InfiniteData<MediaPage>>(QUERY_KEYS.media);

      if (previousMedia) {
        queryClient.setQueryData<InfiniteData<MediaPage>>(QUERY_KEYS.media, {
          ...previousMedia,
          pages: previousMedia.pages.map((page) => ({
            ...page,
            items: page.items.filter((file) => file.path !== path),
          })),
        });
      }

      return { previousMedia };
    },
    onError: (_err, _vars, context) => {
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
