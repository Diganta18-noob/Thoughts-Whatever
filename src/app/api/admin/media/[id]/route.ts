import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requirePermission } from "@/lib/auth";
import { getMediaDetails, updateMediaMetadata, deleteMediaRecord } from "@/lib/media";

type RouteProps = {
  params: Promise<{ id: string }> | { id: string };
};

export async function GET(req: NextRequest, props: RouteProps) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const rawParams = await props?.params;
  const id = rawParams?.id;

  if (!id) {
    return NextResponse.json({ ok: false, error: "id_required" }, { status: 400 });
  }

  const media = await getMediaDetails(id);
  if (!media) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, media });
}

export async function PUT(req: NextRequest, props: RouteProps) {
  const admin = await requirePermission("media", "update");
  if (!admin) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const rawParams = await props?.params;
  const id = rawParams?.id;

  if (!id) {
    return NextResponse.json({ ok: false, error: "id_required" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const updated = await updateMediaMetadata(
      id,
      {
        altText: body.altText,
        caption: body.caption,
        filename: body.filename,
      },
      admin
    );

    return NextResponse.json({ ok: true, media: updated });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, props: RouteProps) {
  const admin = await requirePermission("media", "delete");
  if (!admin) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const rawParams = await props?.params;
  const id = rawParams?.id;

  if (!id) {
    return NextResponse.json({ ok: false, error: "id_required" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const force = searchParams.get("force") === "true";

  try {
    const result = await deleteMediaRecord(id, admin, force);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
