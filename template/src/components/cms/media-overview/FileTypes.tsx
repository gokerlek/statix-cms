import { FileType } from "lucide-react";

import ui from "@/content/ui.json";

interface FileTypesProps {
  typeDistribution: Record<string, number>;
}

export function FileTypes({ typeDistribution }: FileTypesProps) {
  // Sort types by count
  const sortedTypes = Object.entries(typeDistribution)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5); // Top 5 types

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
        <FileType className="h-4 w-4" /> {ui.mediaOverview.fileTypes}
      </h4>

      <div className="space-y-2">
        {sortedTypes.map(([type, count]) => (
          <div key={type} className="flex items-center justify-between text-sm">
            <span className="uppercase bg-secondary px-2 py-0.5 rounded text-xs font-medium">
              {type}
            </span>

            <span className="text-muted-foreground">
              {count} {ui.mediaOverview.files}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
