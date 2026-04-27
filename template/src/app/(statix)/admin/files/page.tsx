import { requirePermissionOrRedirect } from "@/statix/lib/session";
import { P } from "@/statix/types/permissions";

import { FilesClientPage } from "./FilesClientPage";

export const dynamic = "force-dynamic";

export default async function FilesPage() {
  await requirePermissionOrRedirect(P.MANAGE_MEDIA);
  return <FilesClientPage />;
}
