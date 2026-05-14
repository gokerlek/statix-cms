"use client";

import { IconFile, IconPhoto, IconUpload } from "@tabler/icons-react";

import { Button } from "@/statix/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/statix/components/ui/drawer";
import ui from "@/statix/content/ui.json";
import { useMediaStore } from "@/statix/stores/useMediaStore";

import { MediaLibrary } from "./MediaLibrary";
import { UploadSection } from "./UploadSection";

/**
 * Convert a public R2 URL into the bare object key — same shape that
 * `FileField` persists in content. We use the URL pathname rather than
 * importing `extractR2Key` from `lib/r2` because that file pulls in
 * the AWS SDK and would bloat the client bundle. R2 public URLs always
 * sit at the bucket root, so `URL(url).pathname.slice(1)` is enough.
 */
function urlToKey(url: string): string {
  try {
    return new URL(url).pathname.replace(/^\//, "");
  } catch {
    return url;
  }
}

export function MediaDrawer() {
  const { isOpen, closeDrawer, mode, target, onSelect, setMode } =
    useMediaStore();

  const isFiles = target === "files";

  const handleSelect = (url: string, file?: { path: string }) => {
    if (onSelect) {
      // Files store the R2 key in content (`FileField:109`), so the
      // drawer hands back `file.path` (== key) when target=files.
      // Media stores the public URL.
      const value = isFiles && file?.path ? file.path : url;
      onSelect(value);
      closeDrawer();
    }
  };

  const handleUploadSuccess = (url: string) => {
    if (onSelect) {
      const value = isFiles ? urlToKey(url) : url;
      onSelect(value);
    }
    closeDrawer();
  };

  const headerTitle =
    mode === "upload"
      ? isFiles
        ? ui.uploadSection.titleFiles
        : ui.uploadSection.title
      : isFiles
            ?ui.uploadSection.titleFiles
            :ui.mediaDrawer.selectMedia;

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <DrawerContent className="fixed inset-x-0 bottom-0 h-[85vh] flex-col rounded-t-[10px]">
        <div className="mx-auto mt-3 h-2 w-[100px] rounded-full bg-muted shrink-0" />
        <div className="mx-auto w-full max-w-4xl flex flex-col flex-1 min-h-0">
          <DrawerHeader className="flex justify-between items-center px-6 py-4 border-b">
            <DrawerTitle>{headerTitle}</DrawerTitle>

            {/* Mode Navigation */}
            <div className="flex gap-2">
              {mode === "select" && (
                <Button
                  size="sm"
                  onClick={() => setMode("upload")}
                  className="gap-2"
                >
                  <IconUpload className="w-4 h-4" />

                  {ui.mediaDrawer.addNew}
                </Button>
              )}

              {mode === "upload" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setMode("select")}
                  className="gap-2"
                >
                  {isFiles ? (
                    <IconFile className="w-4 h-4" />
                  ) : (
                    <IconPhoto className="w-4 h-4" />
                  )}

                  {ui.mediaDrawer.selectFromGallery}
                </Button>
              )}
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-6">
            {mode === "select" ? (
              <MediaLibrary target={target} onSelect={handleSelect} />
            ) : (
              <UploadSection
                target={target}
                onSuccess={handleUploadSuccess}
                compact
              />
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
