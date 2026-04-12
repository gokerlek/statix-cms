import { z } from "zod";

import { CONTENT_STATUSES } from "@/lib/content-status";

// ── Shared validators ──────────────────────────────────────────

const safePath = z
  .string()
  .min(1, "Path is required")
  .refine((p) => !p.includes("..") && !p.includes("//"), "Invalid path");

const r2Key = safePath.refine(
  (k) =>
    k.startsWith("uploads/") ||
    k.startsWith("avatars/") ||
    k.startsWith("trash/") ||
    k.startsWith("files/"),
  "Invalid storage key",
);

const folderName = z
  .string()
  .refine(
    (f) => !f || f === "default" || /^[a-zA-Z0-9_-]+$/.test(f),
    "Invalid folder name",
  );

// ── Route-specific schemas ─────────────────────────────────────

export const mediaDeleteSchema = z
  .object({
    url: z.string().optional(),
    key: z.string().optional(),
  })
  .refine((d) => d.url || d.key, "url or key is required");

export const mediaMoveSchema = z
  .object({
    currentUrl: z.string().optional(),
    currentPath: z.string().optional(),
    newFolder: folderName,
  })
  .refine(
    (d) => d.currentUrl || d.currentPath,
    "currentUrl or currentPath is required",
  );

export const trashItemSchema = z.object({
  type: z.enum(["content", "media"]),
  path: safePath,
});

export const trashActionSchema = z.object({
  items: z.array(trashItemSchema).min(1, "At least one item is required"),
});

export const fileDeleteSchema = z.object({
  key: z
    .string()
    .min(1, "Key is required")
    .startsWith("files/", "Key must start with files/"),
});

export const contentSaveSchema = z
  .object({
    status: z.enum(CONTENT_STATUSES as unknown as [string, ...string[]]).optional(),
  })
  .passthrough();

// ── Validation helper ──────────────────────────────────────────

export const r2KeySchema = r2Key;
