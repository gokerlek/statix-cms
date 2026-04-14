import { NextRequest, NextResponse } from "next/server";

import { mediaDeleteSchema, r2KeySchema } from "@/statix/lib/api-schemas";
import { handleApiError } from "@/statix/lib/api-response";
import { writeAudit, getIp } from "@/statix/lib/audit";
import { extractR2Key, softDeleteR2 } from "@/statix/lib/r2";
import { requirePermission } from "@/statix/lib/session";
import { P } from "@/statix/types/permissions";

export async function POST(request: NextRequest) {
  try {
    const { session } = await requirePermission(P.MANAGE_MEDIA);

    const body = await request.json();
    const parsed = mediaDeleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { url, key } = parsed.data;
    const r2Key = key || (url ? extractR2Key(url) : null);

    if (!r2Key) {
      return NextResponse.json(
        { error: "Could not resolve media key" },
        { status: 400 },
      );
    }

    const keyValidation = r2KeySchema.safeParse(r2Key);
    if (!keyValidation.success) {
      return NextResponse.json(
        { error: keyValidation.error.issues[0]?.message ?? "Invalid media key" },
        { status: 400 },
      );
    }

    const trashKey = await softDeleteR2(r2Key);

    await writeAudit({
      userId: session.user.id,
      userEmail: session.user.email,
      action: "media.soft_delete",
      entityType: "media",
      entityId: r2Key,
      metadata: { trashKey },
      ipAddress: getIp(request),
    });

    return NextResponse.json({ success: true, trashKey });
  } catch (error) {
    return handleApiError(error, "Failed to delete media");
  }
}
