"use client";

import { Image as ImageIcon, Upload } from "lucide-react";

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
      <DrawerContent>
        <div className="mx-auto w-full max-w-4xl flex flex-col h-full">
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
                  <Upload className="w-4 h-4" />

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
                  <ImageIcon className="w-4 h-4" />

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
