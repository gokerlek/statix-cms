"use client";

import { useEffect } from "react";

import { useBreadcrumb } from "./BreadcrumbContext";

export function PageTitleUpdater({ title }: { title: string }) {
  const { setCustomTitle } = useBreadcrumb();

  useEffect(() => {
    setCustomTitle(title);

    return () => setCustomTitle(null);
  }, [title, setCustomTitle]);

  return null;
}
