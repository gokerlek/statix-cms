export const QUERY_KEYS = {
  users: ["users"] as const,
  activity: ["activity"] as const,
  media: ["media"] as const,
  mediaStats: ["media", "stats"] as const,
  mediaReferences: (filename: string) => ["media-references", filename] as const,
  trash: ["trash"] as const,
  collection: (slug: string) => ["collection", slug] as const,
  content: (collectionSlug: string, id: string, isNew: boolean) =>
    ["content", collectionSlug, id, isNew] as const,
} as const;
