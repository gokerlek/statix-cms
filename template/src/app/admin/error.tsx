"use client";

import { useEffect } from "react";

import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ui from "@/content/ui.json";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Admin page error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="max-w-md w-full">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4 text-center">
          <IconAlertCircle className="h-12 w-12 text-destructive" />
          <div className="space-y-1">
            <p className="font-medium">{ui.common.error.title}</p>
            <p className="text-sm text-muted-foreground">
              {ui.common.error.description}
            </p>
          </div>
          <Button variant="outline" onClick={reset}>
            <IconRefresh className="h-4 w-4 mr-2" />
            {ui.common.error.retry}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
