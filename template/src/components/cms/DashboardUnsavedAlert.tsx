"use client";

import { useState } from "react";
import Link from "next/link";

import { AlertCircle, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ui from "@/content/ui.json";
import { ROUTES } from "@/lib/constants";
import { useUnsavedStore } from "@/stores/useUnsavedStore";

export function DashboardUnsavedAlert() {
  const unsavedItems = useUnsavedStore((state) => state.unsavedItems);
  const isAlertDismissed = useUnsavedStore((state) => state.isAlertDismissed);
  const dismissAlert = useUnsavedStore((state) => state.dismissAlert);
  const [open, setOpen] = useState(false);

  const items = Object.values(unsavedItems);
  const count = items.length;

  if (count === 0 || isAlertDismissed) {
    return null;
  }

  const collectionText = "collection • last_updated_at last_updated_Time";

  return (
    <div
      className="mb-6 rounded-lg border p-4 bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900 text-orange-800 dark:text-orange-200 relative w-full"
      role="alert"
    >
      <div className="flex items-center gap-2 mb-1">
        <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />

        <h5 className="font-medium leading-none tracking-tight flex items-center gap-2">
          {ui.dashboard.alert.title}

          <Badge
            variant="outline"
            className="ml-2 border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300"
          >
            {ui.dashboard.alert.subtitle.replace("{count}", count.toString())}
          </Badge>
        </h5>
      </div>

      <div className="text-sm [&_p]:leading-relaxed flex items-center justify-between">
        <span>{ui.dashboard.alert.description}</span>

        <div className="flex items-center gap-2 ml-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-white dark:bg-background border-orange-200 hover:bg-orange-100 hover:text-orange-900 dark:border-orange-800 dark:hover:bg-orange-900/40"
              >
                {ui.dashboard.alert.viewList}
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>{ui.dashboard.alert.dialogTitle}</DialogTitle>
              </DialogHeader>

              <div className="py-4 space-y-2 max-h-[60vh] overflow-y-auto">
                {items.map((item) => (
                  <Link
                    key={`${item.collectionSlug}-${item.id}`}
                    href={ROUTES.ADMIN.COLLECTION_ITEM(
                      item.collectionSlug,
                      item.id,
                    )}
                    className="flex justify-between items-center p-3 rounded-lg border hover:bg-muted transition-colors group"
                    onClick={() => setOpen(false)}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground" />

                      <div>
                        <div className="font-medium text-sm group-hover:text-primary transition-colors">
                          {item.title}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {collectionText
                            .replace("collection", item.collectionSlug)
                            .replace(
                              "last_updated_at",
                              ui.dashboard.alert.lastUpdated,
                            )
                            .replace(
                              "last_updated_Time",
                              new Date(item.lastUpdated).toLocaleTimeString(),
                            )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="ghost"
            size="sm"
            onClick={dismissAlert}
            className="text-orange-700 hover:text-orange-900 hover:bg-orange-100 dark:text-orange-300 dark:hover:bg-orange-900/40"
          >
            {ui.dashboard.alert.dismiss}
          </Button>
        </div>
      </div>
    </div>
  );
}
