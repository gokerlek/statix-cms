import { requirePermissionOrRedirect } from "@/statix/lib/session";
import { MediaClientPage } from "./MediaClientPage";
import { P } from "@/statix/types/permissions";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  await requirePermissionOrRedirect(P.MANAGE_MEDIA);
  return <MediaClientPage />;
}
