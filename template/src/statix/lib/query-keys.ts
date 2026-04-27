export const QUERY_KEYS = {
  users: ["users"] as const,
  activity: ["activity"] as const,
  media: ["media"] as const,
  files: ["files"] as const,
  mediaStats: ["media", "stats"] as const,
  mediaReferences: (filename: string) => ["media-references", filename] as const,
  fileReferences: (key: string) => ["file-references", key] as const,
  trash: ["trash"] as const,
  collection: (slug: string) => ["collection", slug] as const,
  content: (collectionSlug: string, id: string, isNew: boolean) =>
    ["content", collectionSlug, id, isNew] as const,
} as const;
