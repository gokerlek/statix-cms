"use client";

import { IconTrashFilled } from "@tabler/icons-react";

import { useTranslation } from "@/statix/hooks/use-translation";
import { useTrash } from "@/statix/hooks/use-trash";
import { ROUTES } from "@/statix/lib/constants";

import { CMSIconCard } from "@/statix/components/shared/CMSIconCard";

export function TrashCard() {
  const { data: trashItems } = useTrash();
  const { t } = useTranslation();
  const count = trashItems?.length || 0;

  return (
    <CMSIconCard
      icon={<IconTrashFilled className="size-8 text-destructive" />}
      badge={count ?? 0}
      href={ROUTES.ADMIN.TRASH}
      tooltip={t("trash.title")}
    />
  );
}
