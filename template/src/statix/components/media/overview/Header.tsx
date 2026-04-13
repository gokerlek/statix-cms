import Link from "next/link";

import { IconPhoto } from "@tabler/icons-react";

import { Button } from "@/statix/components/ui/button";
import { CardHeader, CardTitle } from "@/statix/components/ui/card";
import ui from "@/statix/content/ui.json";
import { ROUTES } from "@/statix/lib/constants";

export function Header() {
  return (
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className="flex items-center gap-2">
        <IconPhoto className="h-5 w-5" />

        {ui.mediaOverview.title}
      </CardTitle>

      <Button variant="outline" size="sm" asChild>
        <Link href={ROUTES.ADMIN.MEDIA}>{ui.common.viewAll}</Link>
      </Button>
    </CardHeader>
  );
}
