import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

import { getR2Client } from "@/statix/lib/r2";
import { getSession } from "@/statix/lib/session";
import { env } from "@/statix/lib/env";

// R2'den S3 API ile proxy — public URL engellendiğinde çalışır
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: pathArray } = await params;
  const key = pathArray.join("/");

  // Block path traversal and double slashes regardless of prefix
  if (key.includes("..") || key.includes("//")) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Public prefixes — no auth required
  const PUBLIC_PREFIXES = ["uploads/", "avatars/"];
  // Auth-gated prefixes — require a valid session
  const PRIVATE_PREFIXES = ["trash/"];

  const isPublic = PUBLIC_PREFIXES.some((p) => key.startsWith(p));
  const isPrivate = PRIVATE_PREFIXES.some((p) => key.startsWith(p));

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
    const isInlineType = contentType.startsWith("image/") || contentType === "application/pdf";

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
