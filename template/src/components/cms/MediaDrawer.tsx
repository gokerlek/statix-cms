"use client";

import { IconPhoto, IconUpload } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import ui from "@/content/ui.json";
import { useMediaStore } from "@/stores/useMediaStore";

import { MediaLibrary } from "./MediaLibrary";
import { UploadSection } from "./UploadSection";

export function MediaDrawer() {
  const { isOpen, closeDrawer, mode, onSelect, setMode } = useMediaStore();

  const handleSelect = (url: string) => {
    if (onSelect) {
      onSelect(url);
      closeDrawer();
    }
  };

  const handleUploadSuccess = (url: string) => {
    if (onSelect) {
      onSelect(url);
    }

    closeDrawer();
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <DrawerContent className="fixed inset-x-0 bottom-0 h-[85vh] flex-col rounded-t-[10px]">
        <div className="mx-auto mt-3 h-2 w-[100px] rounded-full bg-muted shrink-0" />
        <div className="mx-auto w-full max-w-4xl flex flex-col flex-1 min-h-0">
          <DrawerHeader className="flex justify-between items-center px-6 py-4 border-b">
            <DrawerTitle>
              {mode === "upload"
                ? ui.uploadSection.title
                : ui.mediaDrawer.selectMedia}
            </DrawerTitle>

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
                  <IconPhoto className="w-4 h-4" />

                  {ui.mediaDrawer.selectFromGallery}
                </Button>
              )}
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-6">
            {mode === "select" ? (
              <MediaLibrary onSelect={handleSelect} />
            ) : (
              <UploadSection onSuccess={handleUploadSuccess} compact />
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
