"use client";

import { MediaLibrary } from "@/statix/components/media/MediaLibrary";
import { UploadSection } from "@/statix/components/media/UploadSection";
import ui from "@/statix/content/ui.json";

export function FilesClientPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{ui.filesPage.title}</h1>
        <p className="text-muted-foreground">{ui.filesPage.description}</p>
      </div>

      <UploadSection target="files" />

      <MediaLibrary target="files" />
    </div>
  );
}
