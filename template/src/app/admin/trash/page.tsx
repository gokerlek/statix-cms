import { requirePermissionOrRedirect } from "@/statix/lib/session";
import { TrashClientPage } from "./TrashClientPage";
import { P } from "@/statix/types/permissions";

export const dynamic = "force-dynamic";

export default async function TrashPage() {
  await requirePermissionOrRedirect(P.MANAGE_TRASH);
  return <TrashClientPage />;
}
