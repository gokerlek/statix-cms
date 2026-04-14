"use client";

import Link from "next/link";

import { Badge } from "@/statix/components/ui/badge";
import { Card, CardContent } from "@/statix/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/statix/components/ui/tooltip";
import { cn } from "@/statix/lib/utils";

interface CMSIconCardProps {
  icon: React.ReactNode;
  badge?: number | string;
  href?: string;
  onClick?: () => void;
  tooltip?: string;
  className?: string;
}

export function CMSIconCard({
  icon,
  badge,
  href,
  onClick,
  tooltip,
  className,
}: CMSIconCardProps) {
  const card = (
    <Card
      className={cn(
        "hover:bg-muted/50 transition-colors cursor-pointer h-full items-center justify-center relative flex-1",
        className,
      )}
    >
      {href ? (
        <Link href={href}>
          {badge != null && (
            <Badge variant="outline" className="absolute top-2 right-2 px-1.5">
              {badge}
            </Badge>
          )}
          <CardContent className="flex flex-col items-center gap-2">
            {icon}
          </CardContent>
        </Link>
      ) : (
        <div
          role={onClick ? "button" : undefined}
          tabIndex={onClick ? 0 : undefined}
          onClick={onClick}
          onKeyDown={
            onClick
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick();
                  }
                }
              : undefined
          }
        >
          {badge != null && (
            <Badge variant="outline" className="absolute top-2 right-2 px-1.5">
              {badge}
            </Badge>
          )}
          <CardContent className="flex flex-col items-center gap-2">
            {icon}
          </CardContent>
        </div>
      )}
    </Card>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger>{card}</TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return card;
}
