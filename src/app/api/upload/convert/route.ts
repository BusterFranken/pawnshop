import { NextRequest, NextResponse } from "next/server";
import { putObject, getPublicUrl, isS3Configured } from "@/lib/s3";
import { nanoid } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const heicConvert = require("heic-convert");

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const allowedTypes = ["image/heic", "image/heif"];
  if (
    !allowedTypes.includes(file.type) &&
    !/\.heic$/i.test(file.name) &&
    !/\.heif$/i.test(file.name)
  ) {
    return NextResponse.json(
      { error: "Only HEIC/HEIF files accepted" },
      { status: 400 }
    );
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const jpegBuffer = await heicConvert({
    buffer: inputBuffer,
    format: "JPEG",
    quality: 0.92,
  });

  if (isS3Configured()) {
    const key = `appraisals/${nanoid()}/${Date.now()}.jpg`;
    await putObject(key, Buffer.from(jpegBuffer), "image/jpeg");
    const publicUrl = getPublicUrl(key);
    return NextResponse.json({ key, publicUrl });
  }

  // No S3 — return base64 data URL
  const base64 = Buffer.from(jpegBuffer).toString("base64");
  const dataUrl = `data:image/jpeg;base64,${base64}`;
  return NextResponse.json({ key: `local-converted`, publicUrl: dataUrl });
}
