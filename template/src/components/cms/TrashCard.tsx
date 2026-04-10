"use client";

import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/use-translation";
import { useTrash } from "@/hooks/use-trash";
import { ROUTES } from "@/lib/constants";
import { IconTrashFilled } from "@tabler/icons-react";

export function TrashCard() {
  const { data: trashItems } = useTrash();
  const { t } = useTranslation();
  const count = trashItems?.length || 0;

  return (
          <Tooltip>
            <TooltipTrigger asChild>
    <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full items-center justify-center relative flex-1">
      <Link href={ROUTES.ADMIN.TRASH}>

        <Badge variant='outline' className="absolute top-2 right-2 px-1.5">{count??0}</Badge>

        <CardContent className="flex flex-col items-center gap-2">
              <IconTrashFilled className="size-8 text-destructive" />
        </CardContent>
      </Link>
    </Card>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("trash.title")}</p>
            </TooltipContent>
          </Tooltip>
  );
}
