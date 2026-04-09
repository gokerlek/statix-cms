"use client";

import Link from "next/link";

import { Trash2 } from "lucide-react";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import { useTrash } from "@/hooks/use-trash";
import { ROUTES } from "@/lib/constants";
import {Badge} from "@/components/ui/badge";

export function TrashCard() {
  const { data: trashItems } = useTrash();
  const { t } = useTranslation();
  const count = trashItems?.length || 0;

  return (
    <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full items-center justify-center relative">
      <Link href={ROUTES.ADMIN.TRASH}>

        <Badge variant='outline' className="absolute top-2 right-2 px-1.5">{count??0}</Badge>

        <CardContent className="flex flex-col items-center gap-2">

          <Trash2 className="size-8 text-muted-foreground" />

          <CardTitle>{t("trash.title")}</CardTitle>
        </CardContent>
      </Link>
    </Card>
  );
}
