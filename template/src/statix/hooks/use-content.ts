import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ContentFormValues } from "@/statix/types/content";
import { QUERY_KEYS } from "@/statix/lib/query-keys";

interface UseContentOptions {
  collectionSlug: string;
  id?: string;
}

export function useContent({ collectionSlug, id }: UseContentOptions) {
  const queryClient = useQueryClient();
  const isNew = id === "new";

  const contentQuery = useQuery({
    queryKey: QUERY_KEYS.content(collectionSlug, id ?? "", isNew),
    queryFn: async () => {
      if (isNew || !id) return null;

      const res = await fetch(`/api/content/${collectionSlug}/${id}`);

      if (!res.ok) throw new Error("Failed to fetch content");

      return res.json();
    },
    enabled: !!id && !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ContentFormValues) => {
      const url = `/api/content/${collectionSlug}/${id}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Failed to save content");
      }

      return res.json();
    },
    onSuccess: (_data) => {
      toast.success("Content saved successfully");
      queryClient.invalidateQueries({ queryKey: ["content", collectionSlug] }); // prefix match
      // If it was new, we might want to redirect or update the URL, but that's handled in the component usually
    },
    onError: (err: Error) => {
      console.error("Save error:", err);
      toast.error("Save failed", { description: err.message });
    },
  });

  return {
    content: contentQuery.data,
    isLoading: contentQuery.isLoading,
    isError: contentQuery.isError,
    error: contentQuery.error,
    saveContent: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
}
