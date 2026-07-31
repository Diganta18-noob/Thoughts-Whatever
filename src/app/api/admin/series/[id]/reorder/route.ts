import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { episodeOrders } = body; // Array of { pieceId: string, seriesOrder: number }

    if (!Array.isArray(episodeOrders)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Update orders in a transaction
    await prisma.$transaction(
      episodeOrders.map((item: { pieceId: string; seriesOrder: number }) =>
        prisma.piece.update({
          where: { id: item.pieceId },
          data: { seriesOrder: item.seriesOrder },
        })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to reorder series episodes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
