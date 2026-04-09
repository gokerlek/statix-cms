import Link from "next/link";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/lib/constants";
import {Badge} from "@/components/ui/badge";
import {IconCookieManFilled} from "@tabler/icons-react";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/use-translation";

interface UsersCardProps {
  userCount?: number;
}

export function UsersCard({ userCount }: UsersCardProps) {
    const { t } = useTranslation();

    return (
      <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full items-center justify-center relative">
      <Link href={ROUTES.ADMIN.USERS}>
        <Badge variant='outline' className="absolute top-2 right-2 px-1.5">{userCount??0}</Badge>

        <CardContent className="flex flex-col items-center gap-2">
            <Tooltip>
                <TooltipTrigger asChild>
                    <IconCookieManFilled className="size-8 text-primary"  />
                </TooltipTrigger>
                <TooltipContent>
                    <p>{t("trash.title")}</p>
                </TooltipContent>
            </Tooltip>
        </CardContent>
      </Link>
    </Card>
  );
}
