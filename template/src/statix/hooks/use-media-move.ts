"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import ui from "@/statix/content/ui.json";
import { QUERY_KEYS } from "@/statix/lib/query-keys";

export type MoveTarget = "media" | "files";

interface MoveMediaParams {
  currentPath: string;
  newFolder: string;
}

interface MoveMediaResponse {
  success: boolean;
  updatedFiles: number;
  updatedFileList?: string[];
  newUrl?: string;
}

interface UseMoveMediaOptions {
  /**
   * Bucket the move targets. `"media"` (default) hits `/api/media/move`
   * — image uploads under `uploads/`. `"files"` hits `/api/files/move`
   * for documents under `files/`. Same payload + response shape so the
   * dialog can call either with one prop change.
   */
  target?: MoveTarget;
}

export function useMoveMedia(options: UseMoveMediaOptions = {}) {
  const { target = "media" } = options;
  const queryClient = useQueryClient();

  const endpoint = target === "files" ? "/api/files/move" : "/api/media/move";
  const queryKey = target === "files" ? QUERY_KEYS.files : QUERY_KEYS.media;

  return useMutation({
    mutationFn: async (params: MoveMediaParams): Promise<MoveMediaResponse> => {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();

        throw new Error(error.error || "Failed to move file");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey });

      const message =
        data.updatedFiles > 0
          ? ui.mediaMove.successWithUpdates.replace(
              "{count}",
              String(data.updatedFiles),
            )
          : ui.mediaMove.success;

      toast.success(message);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
