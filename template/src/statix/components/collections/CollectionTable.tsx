"use client";

import Link from "next/link";

import { IconEdit } from "@tabler/icons-react";

import { DeleteCollectionButton } from "@/statix/components/collections/DeleteCollectionButton";
import { StatusBadge } from "@/statix/components/collections/StatusBadge";
import { Badge } from "@/statix/components/ui/badge";
import { buttonVariants } from "@/statix/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/statix/components/ui/table";
import ui from "@/statix/content/ui.json";
import { ROUTES } from "@/statix/lib/constants";
import { resolveStatus } from "@/statix/lib/content-status";
import { GitHubFile } from "@/statix/lib/github-cms";
import { cn } from "@/statix/lib/utils";
import { useUnsavedStore } from "@/statix/stores/useUnsavedStore";

/** Minimum shape the table renders — accept any row with these fields so
 *  we don't force consumers to over-type their fetched rows. */
type FileRow = GitHubFile & { title?: string; status?: string };

interface CollectionTableProps {
  files: FileRow[];
  collectionSlug: string;
}

/**
 * Reusable table that lists a collection's items. Separated from
 * `CollectionList` so the list page stays focused on filtering and state,
 * and the table can be reused (e.g. in search results, relations picker,
 * or the dashboard "recently edited" widget).
 *
 * Rows with a pending local draft are tinted amber via the `data-unsaved`
 * attribute so Tailwind's JIT picks up the utility classes without any
 * opacity arithmetic.
 */
export function CollectionTable({
  files,
  collectionSlug,
}: CollectionTableProps) {
  const hasChange = useUnsavedStore((state) => state.hasChange);

  return (
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow>
          <TableHead className="px-6 py-4 w-full text-muted-foreground">
            {ui.collectionList.tableHeaders.name}
          </TableHead>
          <TableHead className="px-6 py-4 text-muted-foreground">
            {ui.collectionList.tableHeaders.status}
          </TableHead>
          <TableHead className="px-6 py-4 text-right text-muted-foreground">
            {ui.collectionList.tableHeaders.actions}
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody className="divide-y divide-border">
        {files.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={3}
              className="px-6 py-8 text-center text-muted-foreground"
            >
              {ui.collectionList.noEntriesTitle}
            </TableCell>
          </TableRow>
        ) : (
          files.map((file) => {
            const id = file.name.replace(".json", "");
            const hasLocalChange = hasChange(collectionSlug, id);

            return (
              <TableRow
                key={file.sha}
                data-unsaved={hasLocalChange || undefined}
                className={cn(
                  "data-[unsaved]:bg-amber-100 data-[unsaved]:hover:bg-amber-200/70",
                  "dark:data-[unsaved]:bg-amber-500/10 dark:data-[unsaved]:hover:bg-amber-500/20",
                )}
              >
                <TableCell className="px-6 py-4">
                  <div className="text-sm flex items-center gap-2">
                    {file.title}
                    {hasLocalChange && (
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                        {ui.collectionList.unsavedBadge}
                      </Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell className="px-6 py-4">
                  <StatusBadge status={resolveStatus(file.status)} />
                </TableCell>

                <TableCell className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={ROUTES.ADMIN.COLLECTION_ITEM(collectionSlug, id)}
                      className={cn(
                        buttonVariants({ variant: "secondary", size: "icon" }),
                      )}
                    >
                      <IconEdit className="w-4 h-4" />
                    </Link>

                    <DeleteCollectionButton
                      collectionSlug={collectionSlug}
                      id={id}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
