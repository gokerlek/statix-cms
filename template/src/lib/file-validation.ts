/**
 * Allowed MIME types for file uploads
 */
export const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
  // Documents (if needed in future)
  // "application/pdf",
] as const;

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
 * Validate file upload
 */
export function validateFileUpload(file: File): {
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

  // Check MIME type
  if (
    !ALLOWED_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_MIME_TYPES)[number],
    )
  ) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`,
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
