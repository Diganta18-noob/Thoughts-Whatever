import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const skip = (page - 1) * limit;

  const action = searchParams.get("action") || undefined;
  const entityType = searchParams.get("entityType") || undefined;
  const severity = searchParams.get("severity") || undefined;
  const adminId = searchParams.get("adminId") || undefined;
  const search = searchParams.get("search")?.trim() || undefined;
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined;
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : undefined;
  const isExport = searchParams.get("export") === "csv";

  const where: any = {};

  if (action) {
    where.action = { startsWith: action };
  }
  if (entityType) {
    where.entityType = entityType;
  }
  if (severity) {
    where.severity = severity;
  }
  if (adminId) {
    where.adminId = adminId;
  }
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = from;
    if (to) where.createdAt.lte = to;
  }
  if (search) {
    where.OR = [
      { summary: { contains: search, mode: "insensitive" } },
      { entitySlug: { contains: search, mode: "insensitive" } },
      { adminEmail: { contains: search, mode: "insensitive" } },
      { action: { contains: search, mode: "insensitive" } },
    ];
  }

  try {
    if (isExport) {
      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 2000,
      });

      const headers = ["ID", "Timestamp", "Admin Email", "Admin Name", "Action", "Entity Type", "Entity Slug", "Summary", "Severity", "IP Address"];
      const csvRows = [
        headers.join(","),
        ...logs.map((l) =>
          [
            `"${l.id}"`,
            `"${l.createdAt.toISOString()}"`,
            `"${l.adminEmail || ""}"`,
            `"${l.adminName || ""}"`,
            `"${l.action}"`,
            `"${l.entityType || ""}"`,
            `"${l.entitySlug || ""}"`,
            `"${(l.summary || "").replace(/"/g, '""')}"`,
            `"${l.severity}"`,
            `"${l.ipAddress || ""}"`,
          ].join(",")
        ),
      ];

      return new Response(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="audit-logs-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    const [logs, total, actionsRaw, entityTypesRaw, severitiesRaw, todayCount, criticalCount] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ["action"],
        _count: true,
        orderBy: {
          _count: {
            action: "desc",
          },
        },
        take: 100,
      }),
      prisma.auditLog.groupBy({
        by: ["entityType"],
        _count: true,
      }),
      prisma.auditLog.groupBy({
        by: ["severity"],
        _count: true,
      }),
      prisma.auditLog.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.auditLog.count({
        where: { severity: "critical" },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      stats: {
        total,
        todayCount,
        criticalCount,
      },
      filters: {
        actions: actionsRaw.map((a) => a.action),
        entityTypes: entityTypesRaw.map((e) => e.entityType).filter(Boolean),
        severities: severitiesRaw.map((s) => s.severity),
      },
    });
  } catch (error) {
    console.error("Audit log GET API error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
