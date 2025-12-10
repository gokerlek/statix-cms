import { formatDistanceToNow } from "date-fns";
import { FileText, Image as ImageIcon } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "@/hooks/use-translation";
import { TrashItem } from "@/hooks/use-trash";

interface TrashListProps {
  items: TrashItem[];
  selectedItems: string[];
  onToggleSelect: (path: string) => void;
  onSelectAll: (checked: boolean) => void;
}

export function TrashList({
  items,
  selectedItems,
  onToggleSelect,
  onSelectAll,
}: TrashListProps) {
  const { t } = useTranslation();
  const allSelected = items.length > 0 && selectedItems.length === items.length;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p>{t("trash.empty")}</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 p-4 border-b bg-muted/50 font-medium text-sm">
        <Checkbox
          checked={allSelected}
          onCheckedChange={(checked) => onSelectAll(!!checked)}
        />

        <div>{t("common.name")}</div>

        <div>{t("trash.originalPath")}</div>

        <div>{t("trash.deletedAt")}</div>

        <div>{t("trash.type")}</div>
      </div>

      <div className="divide-y">
        {items.map((item) => (
          <div
            key={item.path}
            className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 p-4 items-center hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              checked={selectedItems.includes(item.path)}
              onCheckedChange={() => onToggleSelect(item.path)}
            />

            <div className="flex items-center gap-2 font-medium">
              {item.type === "media" ? (
                <ImageIcon className="h-4 w-4 text-blue-500" />
              ) : (
                <FileText className="h-4 w-4 text-orange-500" />
              )}

              {item.name}
            </div>

            <div
              className="text-sm text-muted-foreground truncate"
              title={item.originalPath}
            >
              {item.originalPath}
            </div>

            <div className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(item.deletedAt), {
                addSuffix: true,
              })}
            </div>

            <div className="text-xs uppercase px-2 py-1 bg-secondary rounded-full w-fit">
              {item.type === "collection_item" ? "Content" : "Media"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
