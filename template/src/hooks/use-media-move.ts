"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import ui from "@/content/ui.json";

interface MoveMediaParams {
  currentPath: string;
  newFolder: string;
}

interface MoveMediaResponse {
  success: boolean;
  updatedFiles: number;
  updatedFileList: string[];
}

export function useMoveMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: MoveMediaParams): Promise<MoveMediaResponse> => {
      const response = await fetch("/api/media/move", {
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
      queryClient.invalidateQueries({ queryKey: ["media"] });

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
