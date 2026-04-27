/**
 * Raster image formats served inline by `/api/media/serve` — tight allow
 * list, SVG intentionally excluded (inline SVG carries XSS risk).
 */
export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
] as const;

/**
 * Office documents and common archives accepted by the File library
 * (`/api/file` + `/admin/files`). Deliberately restrictive — every new
 * entry needs to survive a security review before being added.
 */
export const DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip",
  "application/x-zip-compressed",
  "application/x-7z-compressed",
  "application/x-rar-compressed",
  "text/plain",
  "text/csv",
  "application/json",
] as const;

/**
 * Legacy export kept for backwards compatibility — older call sites use
 * this name. Matches the image-only allow list so `/api/upload` behaviour
 * is unchanged.
 */
export const ALLOWED_MIME_TYPES = IMAGE_MIME_TYPES;

/** What the caller is trying to upload — drives which allow list applies. */
export type UploadKind = "image" | "file" | "any";

export function getAllowedMimeTypes(kind: UploadKind): readonly string[] {
  if (kind === "image") return IMAGE_MIME_TYPES;

  if (kind === "file") return [...IMAGE_MIME_TYPES, ...DOCUMENT_MIME_TYPES];

  // "any" = image or document — same as "file" today; kept distinct so
  // future branches (e.g. video) can plug in without reshuffling callers.
  return [...IMAGE_MIME_TYPES, ...DOCUMENT_MIME_TYPES];
}

/** Backwards-compat alias used by the validator below. */
const allowListFor = getAllowedMimeTypes;

/**
 * Comma-joined MIME list for HTML `<input accept>`. Frontend dropzones
 * pass this to the file picker so the OS dialog can pre-filter to the
 * exact same MIME types the server will accept — avoids the bad UX of
 * "any file selectable, then 400 from `validateFileUpload`".
 */
export function getAcceptString(kind: UploadKind): string {
  return getAllowedMimeTypes(kind).join(",");
}

/**
 * Client-side MIME guard mirroring `validateFileUpload`'s allow-list
 * check (without the size/extension parts). Used by drag-drop hooks
 * to reject unsupported files before they hit the network — the
 * native `<input accept>` attribute only filters file picker dialogs,
 * not drag-drop, so without this an `.exe` would be uploaded and 400.
 */
export function isMimeAllowed(file: File, kind: UploadKind): boolean {
  return getAllowedMimeTypes(kind).includes(file.type);
}

/** Default max file size: 5MB */
const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Get max upload size from config or use default
 */
export function getMaxUploadSize(): number {
  // Dynamic import to avoid circular dependency at module level
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { statixConfig } = require("@/statix.config");

  return statixConfig.maxUploadSize ?? DEFAULT_MAX_FILE_SIZE;
}

/**
 * File upload limits
 */
export const UPLOAD_LIMITS = {
  /** Maximum file size in bytes (from config or 5MB default) */
  get MAX_FILE_SIZE() {
    return getMaxUploadSize();
  },
  /** Maximum filename length */
  MAX_FILENAME_LENGTH: 255,
} as const;

/**
 * Validate an incoming upload. `kind` selects the MIME allow list:
 *  - `"image"` → tight image-only (default, matches legacy behaviour)
 *  - `"file"`  → images + office docs / archives
 *  - `"any"`   → same as `"file"` today; a seam for future categories
 */
export function validateFileUpload(
  file: File,
  kind: UploadKind = "image",
): {
  valid: boolean;
  error?: string;
} {
  // Check if file exists
  if (!file || file.size === 0) {
    return { valid: false, error: "No file provided" };
  }

  // Check file size
  if (file.size > UPLOAD_LIMITS.MAX_FILE_SIZE) {
    const maxMB = UPLOAD_LIMITS.MAX_FILE_SIZE / (1024 * 1024);

    return {
      valid: false,
      error: `File size exceeds ${maxMB}MB limit`,
    };
  }

  // Check MIME type against the kind-specific allow list.
  const allowed = allowListFor(kind);

  if (!allowed.includes(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed. Allowed types: ${allowed.join(", ")}`,
    };
  }

  // Check filename length
  if (file.name.length > UPLOAD_LIMITS.MAX_FILENAME_LENGTH) {
    return {
      valid: false,
      error: `Filename exceeds ${UPLOAD_LIMITS.MAX_FILENAME_LENGTH} characters`,
    };
  }

  // Check for potentially dangerous file extensions
  const dangerousExtensions = [
    ".exe",
    ".bat",
    ".cmd",
    ".sh",
    ".php",
    ".js",
    ".html",
  ];
  const lowerName = file.name.toLowerCase();

  for (const ext of dangerousExtensions) {
    if (lowerName.endsWith(ext)) {
      return {
        valid: false,
        error: `File extension "${ext}" is not allowed`,
      };
    }
  }

  return { valid: true };
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  let safe = filename.replace(/\.\./g, "");

  // Remove leading/trailing dots and spaces
  safe = safe.replace(/^[\s.]+|[\s.]+$/g, "");

  // Replace unsafe characters
  safe = safe.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_");

  // Limit length
  if (safe.length > UPLOAD_LIMITS.MAX_FILENAME_LENGTH) {
    const ext = safe.lastIndexOf(".");
    const name = safe.slice(0, ext);
    const extension = safe.slice(ext);

    safe =
      name.slice(0, UPLOAD_LIMITS.MAX_FILENAME_LENGTH - extension.length) +
      extension;
  }

  return safe || "file";
}
