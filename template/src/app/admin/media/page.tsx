"use client";

import { MediaLibrary } from "@/components/cms/MediaLibrary";
import { UploadSection } from "@/components/cms/UploadSection";
import ui from "@/content/ui.json";

export default function MediaPage() {
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
