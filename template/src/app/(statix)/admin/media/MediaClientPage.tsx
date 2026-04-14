"use client";

import { MediaLibrary } from "@/statix/components/media/MediaLibrary";
import { UploadSection } from "@/statix/components/media/UploadSection";
import ui from "@/statix/content/ui.json";

export function MediaClientPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{ui.mediaPage.title}</h1>

        <p className="text-muted-foreground">{ui.mediaPage.description}</p>
      </div>

      <UploadSection />

      <MediaLibrary />
    </div>
  );
}
