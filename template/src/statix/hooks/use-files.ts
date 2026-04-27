import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import ui from "@/statix/content/ui.json";
import { QUERY_KEYS } from "@/statix/lib/query-keys";

export interface FileItem {
  name: string;
  key: string;
  url: string;
  size: number;
  lastModified?: string;
  /** `true` when this file's key is not referenced by any content JSON.
   *  Populated by `/api/files/list` against the shared content index. */
  isOrphaned?: boolean;
}

interface FilePage {
  items: FileItem[];
  nextCursor: string | null;
}

/**
 * Infinite, cursor-paginated list of files under the R2 `files/` prefix.
 * Mirrors `useMedia` so `FileLibrary` can share the same sentinel /
 * `fetchNextPage` wiring as `MediaLibrary`.
 */
export function useFiles() {
  return useInfiniteQuery<
    FilePage,
    Error,
    InfiniteData<FilePage>,
    typeof QUERY_KEYS.files,
    string | null
  >({
    queryKey: QUERY_KEYS.files,
    queryFn: async ({ pageParam }) => {
      const url = pageParam
        ? `/api/files/list?cursor=${encodeURIComponent(pageParam)}`
        : "/api/files/list";
      const res = await fetch(url);

      if (!res.ok) throw new Error("Failed to load files");

      return res.json();
    },
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });
}

/**
 * Delete a single file by its R2 key. Optimistically drops the row
 * from the cached list and rolls back on error — same pattern as
 * `useDeleteMedia` so the bulk-delete loop in `FileLibrary` feels
 * instant.
 */
export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (key: string) => {
      const res = await fetch("/api/file", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };

        throw new Error(body.error ?? "Delete failed");
      }

      return res.json();
    },
    onMutate: async (key) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.files });

      const previous = queryClient.getQueryData<InfiniteData<FilePage>>(
        QUERY_KEYS.files,
      );

      if (previous) {
        queryClient.setQueryData<InfiniteData<FilePage>>(QUERY_KEYS.files, {
          ...previous,
          pages: previous.pages.map((page) => ({
            ...page,
            items: page.items.filter((item) => item.key !== key),
          })),
        });
      }

      return { previous };
    },
    onError: (err: Error, _key, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.files, context.previous);
      }

      toast.error(err.message || ui.toasts.error.delete);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.files });
      // Soft-deleted files now live under `trash/files/...` — refresh
      // the Trash page so the just-removed item shows up there.
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.trash });
    },
    onSuccess: () => {
      toast.success(ui.toasts.success.delete);
    },
  });
}

/**
 * Upload a new file to the `files/` prefix. Accepts optional `folder`
 * (collection slug — chooses sub-folder under `files/`) and `filename`
 * override (mirrors `useUploadMedia`'s shape so `UploadSection` can
 * call either with the same call-site).
 */
export function useUploadFile() {
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

      const res = await fetch("/api/file", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };

        throw new Error(body.error ?? "Upload failed");
      }

      return res.json() as Promise<{
        url: string;
        key: string;
        filename: string;
        size: number;
        type: string;
      }>;
    },
    onSuccess: () => {
      toast.success(ui.toasts.success.upload);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.files });
    },
    onError: (err: Error) => {
      toast.error(err.message || ui.toasts.error.upload);
    },
  });
}
