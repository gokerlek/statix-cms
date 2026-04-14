import Link from "next/link";

import { IconPhoto } from "@tabler/icons-react";

import { buttonVariants } from "@/statix/components/ui/button";
import { CardHeader, CardTitle } from "@/statix/components/ui/card";
import ui from "@/statix/content/ui.json";
import { ROUTES } from "@/statix/lib/constants";
import { cn } from "@/statix/lib/utils";

export function Header() {
  return (
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className="flex items-center gap-2">
        <IconPhoto className="h-5 w-5" />

        {ui.mediaOverview.title}
      </CardTitle>

        <Link href={ROUTES.ADMIN.MEDIA} className={cn(buttonVariants({ variant: "outline" }))}>{ui.common.viewAll}</Link>
    </CardHeader>
  );
}
