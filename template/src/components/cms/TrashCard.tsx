"use client";

import Link from "next/link";

import { Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import { useTrash } from "@/hooks/use-trash";
import { ROUTES } from "@/lib/constants";

export function TrashCard() {
  const { data: trashItems } = useTrash();
  const { t } = useTranslation();
  const count = trashItems?.length || 0;

  return (
    <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
      <Link href={ROUTES.ADMIN.TRASH}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t("trash.title")}
          </CardTitle>

          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>

        <CardContent>
          <div className="text-2xl font-bold">{count}</div>

          <p className="text-xs text-muted-foreground">
            {count === 0 ? t("trash.empty") : `${count} items`}
          </p>
        </CardContent>
      </Link>
    </Card>
  );
}
