"use client";

import { IconCookieManFilled } from "@tabler/icons-react";

import { useTranslation } from "@/hooks/use-translation";
import { useUsers } from "@/hooks/use-users";
import { ROUTES } from "@/lib/constants";

import { CMSIconCard } from "./shared/CMSIconCard";

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
