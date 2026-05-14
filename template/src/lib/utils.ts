// shadcn/ui's convention is to import `cn` from `@/lib/utils`. Every
// other utility is co-located in `@/statix/lib/utils` — we re-export the
// whole surface here so both import styles resolve to the same code.
export {
  cn,
  formatFileSize,
  getGitHubRawUrl,
  resolveImageUrl,
  slugify,
} from "@/statix/lib/utils";
