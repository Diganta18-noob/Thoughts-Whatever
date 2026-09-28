import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requirePermission } from "@/lib/auth";
import { MEDIA_TYPES, validateMediaFile } from "@/lib/media-policy";

export async function POST(req: Request) {
  const admin = await requirePermission("media", "create");
  if (!admin) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const { filename, mimeType, sizeBytes } = await req.json().catch(() => ({}));
  const error = validateMediaFile(filename, mimeType, sizeBytes);
  if (error) return NextResponse.json({ ok: false, error }, { status: 400 });

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.replace(/\./g, "-");
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ ok: false, error: "Cloudinary is not configured" }, { status: 503 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "thoughts-whatever/media";
  const signature = cloudinary.utils.api_sign_request({ folder, timestamp }, apiSecret);
  return NextResponse.json({
    ok: true, cloudName, apiKey, folder, timestamp, signature,
    resourceType: MEDIA_TYPES[mimeType.toLowerCase()].resourceType,
  });
}
