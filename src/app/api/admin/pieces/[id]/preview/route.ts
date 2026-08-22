import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requirePermission } from "@/lib/auth";
import { generatePreviewToken } from "@/lib/staging";

type RouteProps = {
  params: Promise<{ id: string }> | { id: string };
};

export async function POST(req: NextRequest, props: RouteProps) {
  const admin = await requirePermission("content", "update");
  if (!admin) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const rawParams = await props?.params;
  const pieceId = rawParams?.id;

  if (!pieceId) {
    return NextResponse.json({ ok: false, error: "id_required" }, { status: 400 });
  }

  try {
    const piece = await generatePreviewToken(pieceId, 72); // 72 hours token validity
    const previewUrl = `/preview/${piece.previewToken}`;

    return NextResponse.json({
      ok: true,
      previewToken: piece.previewToken,
      previewExpiresAt: piece.previewExpiresAt,
      previewUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
