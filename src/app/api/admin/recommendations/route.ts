import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getRecommendationsList,
  computeRecommendationsForPiece,
  recomputeAllRecommendations,
} from "@/lib/recommendations";
import { createAuditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const pieceId = searchParams.get("pieceId") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "30", 10);

  try {
    const data = await getRecommendationsList({ pieceId, page, limit });
    return NextResponse.json({ ok: true, ...data });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Failed to load recommendations" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action } = body;

    if (action === "recompute_all") {
      const count = await recomputeAllRecommendations();
      await createAuditLog({
        adminId: admin.id,
        adminEmail: admin.email,
        adminName: admin.nameBn || "Admin",
        action: "RECOMMENDATIONS_RECOMPUTED_ALL",
        summary: `Recomputed recommendation models for ${count} published pieces`,
      });
      return NextResponse.json({ ok: true, count });
    }

    if (action === "recompute_piece") {
      const { pieceId } = body;
      if (!pieceId) {
        return NextResponse.json({ ok: false, error: "pieceId is required" }, { status: 400 });
      }
      const results = await computeRecommendationsForPiece(pieceId);
      return NextResponse.json({ ok: true, results });
    }

    if (action === "toggle_pin") {
      const { id, pinned } = body;
      const updated = await prisma.contentRecommendation.update({
        where: { id },
        data: { pinned: Boolean(pinned) },
      });
      return NextResponse.json({ ok: true, recommendation: updated });
    }

    if (action === "toggle_exclude") {
      const { id, excluded } = body;
      const updated = await prisma.contentRecommendation.update({
        where: { id },
        data: { excluded: Boolean(excluded) },
      });
      return NextResponse.json({ ok: true, recommendation: updated });
    }

    if (action === "manual_add") {
      const { pieceId, recommendedId, reason } = body;
      if (!pieceId || !recommendedId) {
        return NextResponse.json(
          { ok: false, error: "Both pieceId and recommendedId are required" },
          { status: 400 }
        );
      }

      const rec = await prisma.contentRecommendation.upsert({
        where: {
          pieceId_recommendedId: { pieceId, recommendedId },
        },
        create: {
          pieceId,
          recommendedId,
          score: 100,
          reason: reason || "manual_editorial_pin",
          pinned: true,
        },
        update: {
          score: 100,
          pinned: true,
          excluded: false,
        },
      });

      return NextResponse.json({ ok: true, recommendation: rec });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Recommendations API Error:", error);
    return NextResponse.json(
      { ok: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
