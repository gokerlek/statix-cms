import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function resolveImageUrl(path: string): string {
  if (!path) return "";

  if (path.startsWith("http")) return path;

  if (path.startsWith("/uploads/")) {
    // Remove /uploads/ prefix and use serve endpoint
    const relativePath = path.replace(/^\/uploads\//, "");

    return `/api/media/serve/${relativePath}`;
  }

  return path;
}

export function getGitHubRawUrl(filePath: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_MEDIA_BASE_URL || "";

  if (!baseUrl || !filePath) return "";

  // GitHub raw URL format: https://raw.githubusercontent.com/owner/repo/branch/path
  return `${baseUrl}/${filePath}`;
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w-.]+/g, "") // Remove all non-word characters
    .replace(/--+/g, "-"); // Replace multiple - with single -
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
