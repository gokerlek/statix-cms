import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

import {
  PRIVATE_STORAGE_PREFIXES,
  PUBLIC_STORAGE_PREFIXES,
  safePath,
} from "@/statix/lib/api-schemas";
import { env } from "@/statix/lib/env";
import { getR2Client } from "@/statix/lib/r2";
import { getSession } from "@/statix/lib/session";

/**
 * Proxy fetch an object out of R2 by its key. Public prefixes
 * (`uploads/`, `avatars/`, `files/`) are served without auth; trashed
 * items (`trash/`) require a valid session.
 *
 * Path traversal hardening lives in the shared `safePath` schema — this
 * route just parses the joined path through it.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: pathArray } = await params;
  const rawKey = pathArray.join("/");

  // Validate + normalize path. safePath rejects `..`, URL-encoded traversal,
  // null bytes, backslashes, and strips `public/` legacy prefix / leading
  // slashes.
  const parsed = safePath.safeParse(rawKey);
  if (!parsed.success) {
    return new NextResponse("Not Found", { status: 404 });
  }
  const key = parsed.data;

  const isPublic = PUBLIC_STORAGE_PREFIXES.some((p) => key.startsWith(p));
  const isPrivate = PRIVATE_STORAGE_PREFIXES.some((p) => key.startsWith(p));

  if (!isPublic && !isPrivate) {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (isPrivate) {
    const session = await getSession();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
  }

  if (!env.R2_BUCKET_NAME) {
    return new NextResponse("R2 not configured", { status: 500 });
  }

  try {
    const r2 = getR2Client();
    const obj = await r2.send(
      new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }),
    );

    const contentType = obj.ContentType ?? "application/octet-stream";
    const isInlineType =
      contentType.startsWith("image/") || contentType === "application/pdf";

    const body = obj.Body as ReadableStream;
    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        // Inline for images/PDF so they display in the admin; attachment for everything else
        "Content-Disposition": isInlineType ? "inline" : "attachment",
        ...(obj.ContentLength
          ? { "Content-Length": String(obj.ContentLength) }
          : {}),
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
