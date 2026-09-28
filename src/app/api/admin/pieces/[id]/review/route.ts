import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requirePermission } from "@/lib/auth";
import { addReviewComment, updateReviewStatus } from "@/lib/staging";
import { prisma } from "@/lib/prisma";
import { revalidatePiece } from "@/lib/admin-api";

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

  const piece = await prisma.piece.findUnique({
    where: { id: pieceId },
    select: {
      id: true,
      titleBn: true,
      reviewStatus: true,
      reviewComments: true,
      previewToken: true,
      previewExpiresAt: true,
    },
  });

  if (!piece) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    reviewStatus: piece.reviewStatus || "draft",
    reviewComments: piece.reviewComments || [],
    previewToken: piece.previewToken,
    previewExpiresAt: piece.previewExpiresAt,
  });
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
    const { action } = body;

    if (action === "add_comment") {
      const { comment } = body;
      if (!comment?.trim()) {
        return NextResponse.json({ ok: false, error: "comment_required" }, { status: 400 });
      }
      const newComment = await addReviewComment(pieceId, comment, admin);
      return NextResponse.json({ ok: true, comment: newComment });
    }

    if (action === "update_status") {
      const { status } = body;
      if (!["draft", "in_review", "approved", "scheduled", "published"].includes(status)) {
        return NextResponse.json({ ok: false, error: "invalid_status" }, { status: 400 });
      }
      if ((status === "scheduled" || status === "published") && !(await requirePermission("content", "publish"))) {
        return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
      }
      if (status === "scheduled") {
        const piece = await prisma.piece.findUnique({ where: { id: pieceId }, select: { publishedAt: true } });
        if (!piece) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
        if (!piece.publishedAt || piece.publishedAt <= new Date()) {
          return NextResponse.json({ ok: false, error: "future_publish_date_required" }, { status: 400 });
        }
      }
      const updated = await updateReviewStatus(pieceId, status, admin);
      if (status === "scheduled" || status === "published") revalidatePiece({ kind: updated.kind, slug: updated.slug });
      return NextResponse.json({ ok: true, piece: updated });
    }

    return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
