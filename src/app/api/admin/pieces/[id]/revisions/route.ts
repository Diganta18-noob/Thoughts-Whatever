import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requirePermission } from "@/lib/auth";
import { getPieceRevisions, restorePieceRevision, createRevisionSnapshot } from "@/lib/revisions";
import { prisma } from "@/lib/prisma";

type RouteProps = {
  params: Promise<{ id: string }> | { id: string };
};

export async function GET(req: NextRequest, props: RouteProps) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const rawParams = await props?.params;
  const pieceId = rawParams?.id;

  if (!pieceId) {
    return NextResponse.json({ ok: false, error: "id_required" }, { status: 400 });
  }

  const [revisions, piece] = await Promise.all([
    getPieceRevisions(pieceId),
    prisma.piece.findUnique({
      where: { id: pieceId },
      select: { id: true, slug: true, titleBn: true, kind: true, status: true, updatedAt: true },
    }),
  ]);

  if (!piece) {
    return NextResponse.json({ ok: false, error: "piece_not_found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, revisions, piece });
}

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
    const body = await req.json();
    const action = body.action || "restore";

    if (action === "restore") {
      const { revisionId } = body;
      if (!revisionId) {
        return NextResponse.json({ ok: false, error: "revisionId_required" }, { status: 400 });
      }

      const restoredPiece = await restorePieceRevision(revisionId, admin);
      return NextResponse.json({
        ok: true,
        message: "Revision restored successfully",
        piece: { id: restoredPiece.id, slug: restoredPiece.slug },
      });
    }

    if (action === "snapshot") {
      const revision = await createRevisionSnapshot(pieceId, {
        editedBy: admin.id,
        editedByEmail: admin.email,
        editedByName: admin.nameBn || undefined,
        changeSummary: body.summary || "Manual revision snapshot",
      });

      return NextResponse.json({ ok: true, revision });
    }

    return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
  } catch (err: any) {
    console.error("[RevisionsAPI] Action error:", err);
    return NextResponse.json({ ok: false, error: err.message || "Failed to process revision action" }, { status: 500 });
  }
}
