import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requirePermission } from "@/lib/auth";
import { getMediaList, createMediaRecord, deleteMediaRecord, uploadMediaBuffer } from "@/lib/media";
import { logAuditEvent } from "@/lib/audit";
import { logActivity } from "@/lib/activity";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || undefined;
  const search = searchParams.get("search") || undefined;
  const unusedOnly = searchParams.get("unused") === "true";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "24", 10);
  const sortBy = (searchParams.get("sortBy") as any) || "createdAt";
  const sortOrder = (searchParams.get("sortOrder") as any) || "desc";

  const data = await getMediaList({
    type,
    search,
    unusedOnly,
    page,
    limit,
    sortBy,
    sortOrder,
  });

  return NextResponse.json({ ok: true, ...data });
}

export async function POST(req: NextRequest) {
  const admin = await requirePermission("media", "create");
  if (!admin) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const altText = (formData.get("altText") as string) || "";
    const caption = (formData.get("caption") as string) || "";

    if (!file) {
      return NextResponse.json({ ok: false, error: "no_file_provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || "application/octet-stream";
    const sizeBytes = buffer.length;
    const originalName = file.name || `upload-${Date.now()}`;

    // Upload using standard image handler or base64 storage
    const uploadResult = await uploadMediaBuffer(buffer, originalName, mimeType);

    const media = await createMediaRecord({
      filename: originalName,
      originalName,
      mimeType,
      sizeBytes,
      width: uploadResult.width,
      height: uploadResult.height,
      url: uploadResult.url,
      altText,
      caption,
      uploadedBy: admin.email,
    });

    await logAuditEvent({
      action: "media.uploaded",
      entityType: "Media",
      entityId: media.id,
      summary: `Uploaded file "${originalName}" (${(sizeBytes / 1024).toFixed(1)} KB)`,
      adminId: admin.id,
      adminEmail: admin.email,
    });

    await logActivity({
      type: "media.uploaded",
      summary: `Uploaded file "${originalName}"`,
      entityType: "Media",
      entityId: media.id,
      actorId: admin.id,
      actorEmail: admin.email,
      actorName: admin.nameBn || "Admin",
    });

    return NextResponse.json({ ok: true, media });
  } catch (err: any) {
    console.error("[MediaAPI] Upload failed:", err);
    return NextResponse.json({ ok: false, error: err.message || "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await requirePermission("media", "delete");
  if (!admin) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const force = searchParams.get("force") === "true";

    if (!id) {
      return NextResponse.json({ ok: false, error: "id_required" }, { status: 400 });
    }

    const result = await deleteMediaRecord(id, admin, force);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
