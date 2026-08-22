import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || undefined;
  const entityType = searchParams.get("entityType") || undefined;
  const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10), 100);
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
  const skip = (page - 1) * limit;

  const where: any = {};
  if (type) {
    where.type = { startsWith: type };
  }
  if (entityType) {
    where.entityType = entityType;
  }

  const [activities, total] = await Promise.all([
    prisma.activity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        adminUser: {
          select: { id: true, email: true, nameBn: true, role: true },
        },
      },
    }),
    prisma.activity.count({ where }),
  ]);

  return NextResponse.json({
    ok: true,
    activities,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
}
