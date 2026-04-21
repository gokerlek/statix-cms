import Link from "next/link";

import { IconFileUnknown, IconHome } from "@tabler/icons-react";

import { Button } from "@/statix/components/ui/button";
import { Card, CardContent } from "@/statix/components/ui/card";
import ui from "@/statix/content/ui.json";

/**
 * Admin-specific 404. Uses the same UI kit as the rest of the admin so the
 * navigation and theming stay consistent.
 */
export default function AdminNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4 text-center">
          <IconFileUnknown className="h-12 w-12 text-muted-foreground" />
          <div className="space-y-1">
            <p className="font-medium">{ui.common.notFound.title}</p>
            <p className="text-sm text-muted-foreground">
              {ui.common.notFound.description}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/admin">
              <IconHome className="h-4 w-4 mr-2" />
              {ui.common.notFound.backHome}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
