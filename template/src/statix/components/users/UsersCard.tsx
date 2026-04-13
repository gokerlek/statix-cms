"use client";

import { IconCookieManFilled } from "@tabler/icons-react";

import { useTranslation } from "@/statix/hooks/use-translation";
import { useUsers } from "@/statix/hooks/use-users";
import { ROUTES } from "@/statix/lib/constants";

import { CMSIconCard } from "@/statix/components/shared/CMSIconCard";

export function UsersCard() {
  const { data: users } = useUsers();
  const { t } = useTranslation();
  const userCount = users?.length || 0;

  return (
    <CMSIconCard
      icon={<IconCookieManFilled className="size-8 text-primary" />}
      badge={userCount}
      href={ROUTES.ADMIN.USERS}
      tooltip={t("users.title")}
    />
  );
}
