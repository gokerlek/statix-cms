import Link from "next/link";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CMSCardProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  contentClassName?: string;
  footerClassName?: string;
}

export function CMSCard({
  icon,
  title,
  description,
  action,
  children,
  footer,
  href,
  onClick,
  className,
  contentClassName,
  footerClassName,
}: CMSCardProps) {
  const hasHeader = icon || title || description || action;
  const isInteractive = !!href || !!onClick;

  const interactiveProps = onClick
    ? {
        role: "button" as const,
        tabIndex: 0,
        onClick,
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        },
      }
    : {};

  return (
    <Card
      className={cn(
        "h-full flex flex-col hover:border-primary transition-colors ease-in-out duration-300",
        isInteractive && "cursor-pointer",
        className,
      )}
      {...interactiveProps}
    >
      {hasHeader && (
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>

          {description && <CardDescription>{description}</CardDescription>}

          {action && <CardAction>{action}</CardAction>}
        </CardHeader>
      )}

      {children && (
        <CardContent className={cn("flex-1", contentClassName)}>
          {href ? (
            <Link href={href} className="absolute inset-0 z-10">
              <span className="sr-only">{title}</span>
            </Link>
          ) : null}
          {children}
        </CardContent>
      )}

      {footer && <CardFooter className={footerClassName}>{footer}</CardFooter>}
    </Card>
  );
}
