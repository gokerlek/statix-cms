"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/statix/lib/utils";

interface HtmlContentProps {
  /**
   * HTML string to render. Always passed through DOMPurify before reaching
   * the DOM so the render path stays XSS-safe regardless of where the
   * string originated — we audit this one component, not every caller.
   */
  html: string;
  className?: string;
}

/**
 * Render a ProseKit HTML string as live DOM with DOMPurify sanitization.
 * Used by the RichText diff view to preserve headings, bold/italic, links,
 * and lists in the side-by-side comparison. Dynamic-imports DOMPurify so
 * the admin bundle stays light until a drawer actually opens.
 */
export function HtmlContent({ html, className }: HtmlContentProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [safeHtml, setSafeHtml] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    import("dompurify")
      .then((mod) => {
        const sanitize =
          (mod as unknown as { sanitize?: typeof mod.default.sanitize })
            .sanitize ?? mod.default.sanitize;
        const clean = sanitize(html ?? "", {
          USE_PROFILES: { html: true },
        }) as string;
        if (!cancelled) setSafeHtml(clean);
      })
      .catch(() => {
        if (!cancelled) setSafeHtml("");
      });
    return () => {
      cancelled = true;
    };
  }, [html]);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = safeHtml;
    }
  }, [safeHtml]);

  return (
    <div
      ref={ref}
      className={cn(
        "prose prose-sm max-w-none dark:prose-invert",
        "prose-p:my-1 prose-headings:my-2 prose-li:my-0 prose-ul:my-1 prose-ol:my-1",
        className,
      )}
    />
  );
}
