import { useMemo, useState } from "react";

import { resolveStatus } from "@/statix/lib/content-status";
import { GitHubFile } from "@/statix/lib/github-cms";

export function useCollectionSearch(files: GitHubFile[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      // Filter by search query
      const matchesSearch = file.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // Filter by status
      // Status is now returned by the API based on the folder structure
      const status = resolveStatus(file.status);

      const matchesStatus = statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [files, searchQuery, statusFilter]);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    filteredFiles,
  };
}
