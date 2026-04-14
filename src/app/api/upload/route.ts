import { NextRequest, NextResponse } from "next/server";
import { getPresignedUploadUrl, getPublicUrl } from "@/lib/s3";
import { nanoid } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const { filename, contentType } = await req.json();

  if (!filename || !contentType) {
    return NextResponse.json(
      { error: "filename and contentType are required" },
      { status: 400 }
    );
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
  if (!allowedTypes.includes(contentType)) {
    return NextResponse.json(
      { error: "Unsupported file type" },
      { status: 400 }
    );
  }

  const ext = filename.split(".").pop() || "jpg";
  const key = `appraisals/${nanoid()}/${Date.now()}.${ext}`;

  const presignedUrl = await getPresignedUploadUrl(key, contentType);
  const publicUrl = getPublicUrl(key);

  return NextResponse.json({ presignedUrl, key, publicUrl });
}
