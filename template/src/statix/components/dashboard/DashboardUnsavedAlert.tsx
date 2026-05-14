"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { IconAlertSquareRoundedFilled, IconFileText } from "@tabler/icons-react";

import { Alert, AlertTitle, AlertDescription } from "@/statix/components/ui/alert";
import { Badge } from "@/statix/components/ui/badge";
import { Button, buttonVariants } from "@/statix/components/ui/button";
import { Card } from "@/statix/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/statix/components/ui/dialog";
import ui from "@/statix/content/ui.json";
import { ROUTES } from "@/statix/lib/constants";
import { useUnsavedStore } from "@/statix/stores/useUnsavedStore";
import {cn} from "@/statix/lib/utils";

export function DashboardUnsavedAlert() {
  const unsavedItems = useUnsavedStore((state) => state.unsavedItems);
  const isAlertDismissed = useUnsavedStore((state) => state.isAlertDismissed);
  const dismissAlert = useUnsavedStore((state) => state.dismissAlert);
  const cleanupOrphans = useUnsavedStore((state) => state.cleanupOrphans);
  const clearAll = useUnsavedStore((state) => state.clearAll);
  const [open, setOpen] = useState(false);

  // Drop entries whose matching localStorage draft is gone (tab crashed
  // mid-edit, OS reload, save succeeded but browser died before the store
  // got the message, etc). Runs once on mount — after Zustand hydrates the
  // persisted slice client-side — so we never show a phantom banner.
  useEffect(() => {
    cleanupOrphans();
  }, [cleanupOrphans]);

  const items = Object.values(unsavedItems);
  const count = items.length;

  if (count === 0 || isAlertDismissed) {
    return null;
  }

  const collectionText = "collection • last_updated_at last_updated_Time";


  return (
    <Alert>
      <IconAlertSquareRoundedFilled className="fill-warning w-12 h-12"/>
      <div className="flex-1 flex flex-col gap-1">
      <AlertTitle className="flex items-center gap-2">
        {ui.dashboard.alert.title}
        <Badge variant="outline">
          {ui.dashboard.alert.subtitle.replace("{count}", count.toString())}
        </Badge>
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between flex-wrap gap-5 ">
        <span>{ui.dashboard.alert.description}</span>

        <div className="flex items-center gap-2 ml-4">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger className={cn(buttonVariants({variant: "outline", size: "sm"}),"text-foreground")}>
                {ui.dashboard.alert.viewList}
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>{ui.dashboard.alert.dialogTitle}</DialogTitle>
              </DialogHeader>

              <div className="py-4 space-y-2 max-h-[60vh] overflow-y-auto">
                {items.map((item) => {
                  // Legacy entries persisted before the locales field was
                  // added may not have it — treat as "no locale info".
                  const locales = item.locales ?? [];
                  // Deep-link to the first dirty locale so the editor opens
                  // on the right tab; shared-only edits get no ?locale= param.
                  const href =
                    locales.length > 0
                      ? `${ROUTES.ADMIN.COLLECTION_ITEM(
                          item.collectionSlug,
                          item.id,
                        )}?locale=${locales[0]}`
                      : ROUTES.ADMIN.COLLECTION_ITEM(
                          item.collectionSlug,
                          item.id,
                        );

                  return (
                    <Card
                      key={`${item.collectionSlug}-${item.id}`}
                      className="p-0"
                    >
                      <Link
                        href={href}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors group"
                        onClick={() => setOpen(false)}
                      >
                        <IconFileText className="w-4 h-4 text-muted-foreground" />

                        <div className="flex-1 min-w-0">
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

                        {locales.length > 0 && (
                          <div className="flex items-center gap-1 shrink-0">
                            {locales.map((locale) => (
                              <Badge
                                key={locale}
                                variant="modified"
                                className="uppercase text-[10px] h-5 px-1.5"
                              >
                                {locale}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </Link>
                    </Card>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            title={ui.dashboard.alert.clearAll}
          >
            {ui.dashboard.alert.clearAll}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={dismissAlert}
          >
            {ui.dashboard.alert.dismiss}
          </Button>
        </div>
      </AlertDescription>
      </div>
    </Alert>
  );
}
