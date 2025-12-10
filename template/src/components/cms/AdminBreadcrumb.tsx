"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { ChevronLeft } from "lucide-react";

import { useBreadcrumb } from "@/components/cms/BreadcrumbContext";
import { AreYouSureDialog } from "@/components/ui/are-you-sure-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import ui from "@/content/ui.json";
import { ROUTES } from "@/lib/constants";
import { statixConfig } from "@/statix.config";
import { useUnsavedStore } from "@/stores/useUnsavedStore";

export function AdminBreadcrumb() {
  const pathname = usePathname();
  const router = useRouter();
  const { customTitle } = useBreadcrumb();

  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null,
  );

  // Split and filter empty paths
  const paths = pathname.split("/").filter((path) => path);

  // If on root admin or empty, don't show
  if (paths.length === 0 || pathname === ROUTES.ADMIN.ROOT) return null;

  // Get current collection slug and item id from path
  const baseSegment = ROUTES.ADMIN.ROOT.split("/")[1];
  const currentCollectionSlug = paths.find(
    (p) =>
      p !== baseSegment && statixConfig.collections.some((c) => c.slug === p),
  );

  // Get current item id (the segment after collection slug)
  const collectionIndex = currentCollectionSlug
    ? paths.indexOf(currentCollectionSlug)
    : -1;
  const currentItemId =
    collectionIndex >= 0 && paths.length > collectionIndex + 1
      ? paths[collectionIndex + 1]
      : null;

  // Filter out 'index' from paths for display
  const displayPaths = paths.filter((p) => p !== "index");

  const handleNavigation = (href: string) => {
    // Only check for unsaved changes if we're on an editor page (has item id)
    // and there are unsaved changes for THIS specific item
    if (currentCollectionSlug && currentItemId && currentItemId !== "new") {
      const state = useUnsavedStore.getState();
      const key = `${currentCollectionSlug}-${currentItemId}`;
      const hasUnsaved = !!state.unsavedItems[key];

      if (hasUnsaved) {
        setPendingNavigation(href);
        setShowDraftDialog(true);

        return;
      }
    }

    router.push(href);
  };

  const handleDiscardAndNavigate = () => {
    setShowDraftDialog(false);

    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
  };

  // Calculate parent URL (one level up)
  const getParentUrl = () => {
    // Filter out 'index' for calculating parent
    const pathsWithoutIndex = paths.filter((p) => p !== "index");

    if (pathsWithoutIndex.length <= 1) {
      return ROUTES.ADMIN.ROOT;
    }

    return `/${pathsWithoutIndex.slice(0, -1).join("/")}`;
  };

  const parentUrl = getParentUrl();

  return (
    <>
      <AreYouSureDialog
        open={showDraftDialog}
        onOpenChange={setShowDraftDialog}
        title={ui.toasts.error.unsavedChangesTitle}
        description={ui.toasts.error.unsavedChangesDescription}
        confirmText={ui.toasts.error.exitWithoutSaving}
        onConfirm={handleDiscardAndNavigate}
        confirmVariant="destructive"
      />

      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleNavigation(parentUrl)}
          aria-label="Go back"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Breadcrumb>
          <BreadcrumbList>
            {displayPaths.map((path, index) => {
              const isLast = index === displayPaths.length - 1;
              const originalIndex = paths.indexOf(path);
              const href = `/${paths.slice(0, originalIndex + 1).join("/")}`;

              // Format the label
              let label = "";
              const collection = statixConfig.collections.find(
                (c) => c.slug === path,
              );

              // Check if this path segment is an item ID (not a known segment)
              const isItemSegment =
                path !== baseSegment &&
                !collection &&
                path !== "new" &&
                path !== "index" &&
                path !== "media" &&
                path !== "activity";

              if (path === baseSegment) {
                label = "Dashboard";
              } else if (path === "media") {
                label = ui.mediaPage.title;
              } else if (path === "activity") {
                label = ui.dashboard.stats.recentActivity;
              } else if (collection) {
                label = collection.label;
              } else if (isLast && customTitle) {
                label = customTitle;
              } else if (isLast && isItemSegment && !customTitle) {
                // Show loading placeholder for item IDs until customTitle loads
                label = "...";
              } else {
                label = path
                  .replace(/-/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase());
              }

              return (
                <React.Fragment key={path}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleNavigation(href);
                          }}
                          className="cursor-pointer hover:underline"
                        >
                          {label}
                        </button>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>

                  {!isLast && <BreadcrumbSeparator />}
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </>
  );
}
