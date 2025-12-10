import { useMemo, useState } from "react";

import { GitHubFile } from "@/lib/github-cms";

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
      const status = file.status || "published"; // Default to published for legacy

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
