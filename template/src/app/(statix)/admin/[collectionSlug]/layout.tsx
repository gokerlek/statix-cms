import { ReactNode } from "react";
import { requireCollectionPermissionOrRedirect } from "@/statix/lib/session";
import { CP } from "@/statix/types/permissions";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ collectionSlug: string }>;
}

export default async function CollectionLayout({ children, params }: LayoutProps) {
  const { collectionSlug } = await params;
  await requireCollectionPermissionOrRedirect(collectionSlug, CP.VIEW);
  return <>{children}</>;
}
