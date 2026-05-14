import {
  type Icon,
  IconFile,
  IconFileTypeCsv,
  IconFileTypeDoc,
  IconFileTypeDocx,
  IconFileTypePdf,
  IconFileTypeTxt,
  IconFileTypeXls,
  IconFileTypeZip,
  IconJson,
} from "@tabler/icons-react";

/**
 * Map an extension (case-insensitive) to the Tabler icon component
 * used across the File library. Single source of truth — previously
 * duplicated in `FileLibrary.tsx`, `FilesOverview.tsx`, and would
 * again be needed in `UploadSection` files-mode.
 */
export function getTypeIcon(ext: string): Icon {
  switch (ext.toUpperCase()) {
    case "PDF":
      return IconFileTypePdf;

    case "DOC":
      return IconFileTypeDoc;

    case "DOCX":
      return IconFileTypeDocx;

    case "XLS":

    case "XLSX":
      return IconFileTypeXls;

    case "ZIP":

    case "RAR":

    case "7Z":

    case "TAR":

    case "GZ":
      return IconFileTypeZip;

    case "CSV":
      return IconFileTypeCsv;

    case "JSON":
      return IconJson;

    case "TXT":

    case "MD":
      return IconFileTypeTxt;

    default:
      return IconFile;
  }
}

/**
 * Tailwind color class for the icon of an extension. Matches the palette
 * used by `FilesOverview` stat tiles and the `MediaOverview` type list.
 */
export function getExtensionColor(ext: string): string {
  const map: Record<string, string> = {
    PDF: "text-red-500",
    DOC: "text-blue-500",
    DOCX: "text-blue-500",
    XLS: "text-green-500",
    XLSX: "text-green-500",
    PPT: "text-orange-500",
    PPTX: "text-orange-500",
    ZIP: "text-yellow-600",
    RAR: "text-yellow-600",
    TXT: "text-gray-500",
    MD: "text-gray-500",
    CSV: "text-green-600",
    JSON: "text-purple-500",
    XML: "text-teal-500",
  };

  return map[ext.toUpperCase()] ?? "text-muted-foreground";
}

/** Convenience: pull the extension off a filename. */
export function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");

  return dot >= 0 ? filename.slice(dot + 1).toUpperCase() : "";
}
