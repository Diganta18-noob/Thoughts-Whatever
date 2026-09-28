import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { MEDIA_TYPES, validateMediaFile } from "@/lib/media-policy";
import { createMediaRecord } from "@/lib/media";
import { logAuditEvent } from "@/lib/audit";

export async function POST(req: Request) {
  const admin = await requirePermission("media", "create");
  if (!admin) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const { filename, mimeType, publicId, resourceType, version, signature } = await req.json().catch(() => ({}));
  const policy = typeof mimeType === "string" ? MEDIA_TYPES[mimeType] : undefined;
  if (!policy || typeof filename !== "string" || filename.length > 255 ||
      typeof publicId !== "string" || !publicId.startsWith("thoughts-whatever/media/") ||
      resourceType !== policy.resourceType || !Number.isSafeInteger(version) ||
      typeof signature !== "string" || !/^[a-f0-9]{40}$/i.test(signature)) {
    return NextResponse.json({ ok: false, error: "Invalid upload result" }, { status: 400 });
  }
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.replace(/\./g, "-");
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return NextResponse.json({ ok: false, error: "Cloudinary unavailable" }, { status: 503 });

  const expected = createHash("sha1").update(`public_id=${publicId}&version=${version}${apiSecret}`).digest();
  const received = Buffer.from(signature, "hex");
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return NextResponse.json({ ok: false, error: "Invalid upload signature" }, { status: 400 });
  }

  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  try {
    const resource = await cloudinary.api.resource(publicId, { resource_type: resourceType });
    if (resource.version !== version || !resource.secure_url?.startsWith(`https://res.cloudinary.com/${cloudName}/`)) {
      return NextResponse.json({ ok: false, error: "Upload verification failed" }, { status: 400 });
    }
    const error = validateMediaFile(filename, mimeType, resource.bytes);
    if (error) return NextResponse.json({ ok: false, error }, { status: 400 });
    const extension = filename.split(".").pop()?.toLowerCase();
    const storedFormat = (resource.format || (resourceType === "raw" ? publicId.split(".").pop() : ""))?.toLowerCase();
    if (storedFormat !== extension && !(extension === "jpeg" && storedFormat === "jpg") && !(extension === "m4a" && storedFormat === "mp4")) {
      return NextResponse.json({ ok: false, error: "Uploaded format differs from the selected file" }, { status: 400 });
    }

    const existing = await prisma.media.findFirst({ where: { url: resource.secure_url } });
    if (existing) return NextResponse.json({ ok: true, media: existing });
    const media = await createMediaRecord({
      filename, originalName: filename, mimeType, sizeBytes: resource.bytes,
      width: resource.width, height: resource.height, url: resource.secure_url,
      uploadedBy: admin.email,
      metadata: { duration: typeof resource.duration === "number" ? resource.duration : null, publicId, resourceType },
    });
    await logAuditEvent({ action: "media.uploaded", entityType: "Media", entityId: media.id,
      summary: `Uploaded ${filename}`, adminId: admin.id, adminEmail: admin.email });
    return NextResponse.json({ ok: true, media });
  } catch (error) {
    console.error("Media upload verification failed", error);
    return NextResponse.json({ ok: false, error: "Could not verify uploaded file" }, { status: 502 });
  }
}
