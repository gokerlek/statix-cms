import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Single source of truth for classname merging.
 *
 * Re-exported from `src/lib/utils.ts` so shadcn/ui's `@/lib/utils#cn`
 * convention keeps working without a duplicated implementation.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolve a content-JSON image path to something the `<Image>` tag can render.
 *
 * Handles three historical shapes so existing content JSON doesn't need to be
 * migrated:
 * - Full URL (`https://…`) — passed through.
 * - Legacy `/uploads/<file>` or `public/uploads/<file>` — rewritten to the
 *   `/api/media/serve/uploads/<file>` proxy.
 * - Already-relative paths — passed through.
 */
export function resolveImageUrl(path: string): string {
  if (!path) return "";

  if (path.startsWith("http")) return path;

  // Legacy prefix compatibility (content JSON written before v0.2):
  //   "/uploads/hero.jpg"          → serve endpoint
  //   "public/uploads/hero.jpg"    → serve endpoint
  const stripped = path
    .replace(/^\/+/, "") // leading slashes
    .replace(/^public\//, ""); // legacy public/ prefix

  if (stripped.startsWith("uploads/")) {
    const relativePath = stripped.replace(/^uploads\//, "");
    return `/api/media/serve/uploads/${relativePath}`;
  }

  return path;
}

export function getGitHubRawUrl(filePath: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_MEDIA_BASE_URL || "";

  if (!baseUrl || !filePath) return "";

  // GitHub raw URL format: https://raw.githubusercontent.com/owner/repo/branch/path
  return `${baseUrl}/${filePath}`;
}

/**
 * Map Turkish + common Latin glyphs to their ASCII equivalents so two titles
 * that only differ by accent collapse to the same slug (and the uniqueness
 * check can catch them).
 *
 * Example:
 *   slugify("Türkiye")  // "turkiye"
 *   slugify("türkiye")  // "turkiye"   ← same slug, caught as duplicate
 *   slugify("İstanbul") // "istanbul"
 */
const UNICODE_SLUG_MAP: Record<string, string> = {
  ç: "c", Ç: "c",
  ğ: "g", Ğ: "g",
  ı: "i", İ: "i",
  ö: "o", Ö: "o",
  ş: "s", Ş: "s",
  ü: "u", Ü: "u",
};

export function slugify(text: string): string {
  const mapped = text
    .split("")
    .map((ch) => UNICODE_SLUG_MAP[ch] ?? ch)
    .join("");

  return mapped
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining diacritics (é → e)
    .toLowerCase()
    .trim()
    .replace(/&/g, "-and-")
    .replace(/[^\w-]+/g, "-") // spaces + punctuation → single `-`
    .replace(/-+/g, "-") // dedupe repeated `-`
    .replace(/^-+|-+$/g, "") // trim leading/trailing `-`
    .slice(0, 96);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
