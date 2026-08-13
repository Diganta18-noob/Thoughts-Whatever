import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const start = Date.now();
  try {
    const [pieceCount, documentaryCount, authorCount, adminCount] = await Promise.all([
      prisma.piece.count(),
      prisma.piece.count({ where: { kind: "DOCUMENTARY", status: "PUBLISHED" } }),
      prisma.author.count(),
      prisma.adminUser.count(),
    ]);

    const latencyMs = Date.now() - start;

    return NextResponse.json(
      {
        status: "ok",
        database: "connected",
        latencyMs,
        counts: {
          pieces: pieceCount,
          documentaries: documentaryCount,
          authors: authorCount,
          adminUsers: adminCount,
        },
        isDatabaseEmpty: pieceCount === 0 && authorCount === 0,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "error",
        database: "disconnected",
        error: error?.message || "Database query failed",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }
}
