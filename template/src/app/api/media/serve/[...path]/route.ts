import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

import { getR2Client } from "@/lib/r2";
import { env } from "@/lib/env";

// R2'den S3 API ile proxy — public URL engellendiğinde çalışır
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: pathArray } = await params;
  const key = pathArray.join("/");

  if (!env.R2_BUCKET_NAME) {
    return new NextResponse("R2 not configured", { status: 500 });
  }

  try {
    const r2 = getR2Client();
    const obj = await r2.send(
      new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }),
    );

    const body = obj.Body as ReadableStream;
    return new NextResponse(body, {
      headers: {
        "Content-Type": obj.ContentType ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        ...(obj.ContentLength
          ? { "Content-Length": String(obj.ContentLength) }
          : {}),
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
