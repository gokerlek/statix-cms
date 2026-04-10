"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { IconCookieManFilled } from "@tabler/icons-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/use-translation";
import { useUsers } from "@/hooks/use-users";

export function UsersCard() {
  const { data: users } = useUsers();
  const { t } = useTranslation();
  const userCount = users?.length || 0;

  return (
    <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full items-center justify-center relative flex-1">
      <Link href={ROUTES.ADMIN.USERS}>
        <Badge variant='outline' className="absolute top-2 right-2 px-1.5">{userCount}</Badge>

        <CardContent className="flex flex-col items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <IconCookieManFilled className="size-8 text-primary" />
            </TooltipTrigger>
            <TooltipContent>
              <p>{t("users.title")}</p>
            </TooltipContent>
          </Tooltip>
        </CardContent>
      </Link>
    </Card>
  );
}
