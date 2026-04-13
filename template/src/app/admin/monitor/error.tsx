"use client";

import { useEffect } from "react";

import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";

import { Button } from "@/statix/components/ui/button";
import { Card, CardContent } from "@/statix/components/ui/card";
import ui from "@/statix/content/ui.json";

interface MonitorErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MonitorError({ error, reset }: MonitorErrorProps) {
  useEffect(() => {
    console.error("Monitor page error:", error);
  }, [error]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{ui.monitor.title}</h1>
        <p className="text-muted-foreground text-sm">{ui.monitor.subtitle}</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <IconAlertCircle className="h-12 w-12 text-destructive" />
          <div className="space-y-1">
            <p className="font-medium">{ui.monitor.error.title}</p>
            <p className="text-sm text-muted-foreground">
              {ui.monitor.error.description}
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
