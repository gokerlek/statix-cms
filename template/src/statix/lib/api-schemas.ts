import { z } from "zod";

import { CONTENT_STATUSES } from "@/statix/lib/content-status";

// ── Storage layout (single source of truth) ───────────────────
//
// All R2 keys live under one of these prefixes. The media/serve route, the
// trash endpoints, and the Zod validators all derive from this list so they
// can't drift. If you add a new prefix (e.g. "exports/") add it here and
// update the serve route's PUBLIC/PRIVATE split below.
export const STORAGE_PREFIXES = [
  "uploads/",
  "avatars/",
  "trash/",
  "files/",
] as const;

export type StoragePrefix = (typeof STORAGE_PREFIXES)[number];

// Prefixes that are safe to expose without authentication. Public media (hero
// images, blog covers, user avatars, file attachments rendered on a page) go
// here. Anything under a private prefix requires a session.
export const PUBLIC_STORAGE_PREFIXES = [
  "uploads/",
  "avatars/",
  "files/",
] as const satisfies ReadonlyArray<StoragePrefix>;

export const PRIVATE_STORAGE_PREFIXES = [
  "trash/",
] as const satisfies ReadonlyArray<StoragePrefix>;

// ── Shared validators ──────────────────────────────────────────

/**
 * A path string that is safe to use against R2 / GitHub Contents API.
 *
 * Transform chain:
 *   normalize NFC  →  strip leading slashes  →  strip `public/` legacy prefix
 * Refine chain:
 *   non-empty     · no null byte     · no backslash
 *   decoded (URL) — also has no `..` or `//` hop after percent-decoding
 *
 * The `decodeURIComponent` call is wrapped in try/catch because malformed
 * input like `%ZZ` throws `URIError`, which would bubble out of `.refine`
 * as a 500. We treat malformed URIs as invalid paths.
 */
export const safePath = z
  .string()
  .min(1, "Path is required")
  .max(512, "Path too long (max 512 chars)")
  .transform((s) => s.normalize("NFC"))
  .transform((s) => s.replace(/^\/+/, ""))
  .transform((s) => s.replace(/^public\//, "")) // legacy content-JSON compat
  .refine((s) => s.length > 0, "Empty path after normalize")
  .refine((s) => !s.includes("\0"), "Null byte not allowed")
  .refine((s) => !s.includes("\\"), "Backslash not allowed")
  .refine((s) => {
    try {
      const decoded = decodeURIComponent(s);
      return !decoded.includes("..") && !decoded.includes("//");
    } catch {
      return false; // malformed percent-encoding
    }
  }, "Path traversal detected");

/**
 * A full R2 object key. Must be a safePath AND live under a known prefix.
 */
export const r2Key = safePath.pipe(
  z
    .string()
    .refine(
      (k) => STORAGE_PREFIXES.some((p) => k.startsWith(p)),
      "Invalid storage prefix",
    ),
);

/**
 * A single filename (no slashes) used as a URL path param — e.g. for
 * `/api/trash/media/[filename]` redirects. The single-char allow-list in the
 * regex does NOT block the two-character `..` sequence (`.` appears once in
 * each position), so we add explicit refines.
 */
export const storageFilename = z
  .string()
  .regex(/^[\w.\-]{1,128}$/, "Invalid filename")
  .refine((s) => !s.includes(".."), "`..` sequence not allowed")
  .refine(
    (s) => !s.startsWith(".") && !s.endsWith("."),
    "Leading/trailing dot not allowed",
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
  type: z.enum(["content", "media", "collection_item"]),
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
    // `status` is the only known well-typed field; everything else is
    // collection-defined and flows through via `.passthrough()`.
    status: z
      .enum(CONTENT_STATUSES as unknown as [string, ...string[]])
      .optional(),
    // slug may be auto-generated server-side from title/name/label; if the
    // client sends one we still accept it (the server may overwrite).
    slug: z.string().optional(),
    // _meta is parsed but the server ALWAYS overwrites it via read-modify-
    // write to preserve createdAt / createdBy across updates. Treat as
    // opaque input — never read `data._meta` in a handler.
    _meta: z.unknown().optional(),
    // `id` is NOT declared here on purpose: the server reads it from the URL
    // path and never from the body, so a client sending `{ id: "admin" }`
    // cannot influence which file gets written. It is destructured away in
    // the route handler before we persist.
  })
  .passthrough();

// ── Re-exports for backwards compatibility with existing imports ──
export const r2KeySchema = r2Key;
