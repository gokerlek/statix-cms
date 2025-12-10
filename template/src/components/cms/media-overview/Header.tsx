import Link from "next/link";

import { Image as ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import ui from "@/content/ui.json";
import { ROUTES } from "@/lib/constants";

export function Header() {
  return (
    <CardHeader className="flex flex-row items-center justify-between">
      <CardTitle className="text-lg font-medium flex items-center gap-2">
        <ImageIcon className="h-5 w-5" />

        {ui.mediaOverview.title}
      </CardTitle>

      <Button variant="outline" size="sm" asChild>
        <Link href={ROUTES.ADMIN.MEDIA}>{ui.common.viewAll}</Link>
      </Button>
    </CardHeader>
  );
}
