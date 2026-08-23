import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map((obj) =>
    headers
      .map((header) => {
        const val = obj[header];
        if (val === null || val === undefined) return '""';
        if (typeof val === "object") return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const exportJobs = await prisma.exportJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ ok: true, exportJobs });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { entityType, format = "CSV", filters = {} } = body;

    let dataToExport: any[] = [];

    switch (entityType) {
      case "PIECES":
        dataToExport = await prisma.piece.findMany({
          select: {
            id: true,
            slug: true,
            kind: true,
            status: true,
            titleBn: true,
            titleEn: true,
            subtitleBn: true,
            readingMinutes: true,
            viewCount: true,
            publishedAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        });
        break;

      case "SUBSCRIBERS":
        dataToExport = await prisma.subscriber.findMany({
          select: {
            id: true,
            email: true,
            nameBn: true,
            confirmed: true,
            source: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        });
        break;

      case "AUDIT_LOGS":
        dataToExport = await prisma.auditLog.findMany({
          select: {
            id: true,
            adminEmail: true,
            action: true,
            entityType: true,
            summary: true,
            severity: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 500,
        });
        break;

      case "ANALYTICS":
        dataToExport = await prisma.analyticsEvent.findMany({
          select: {
            id: true,
            pieceId: true,
            eventType: true,
            sessionId: true,
            referrer: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 1000,
        });
        break;

      case "MEDIA":
        dataToExport = await prisma.media.findMany({
          select: {
            id: true,
            filename: true,
            originalName: true,
            mimeType: true,
            sizeBytes: true,
            url: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        });
        break;

      default:
        return NextResponse.json({ ok: false, error: "Invalid entity type" }, { status: 400 });
    }

    const rowCount = dataToExport.length;
    let exportContent = "";
    if (format === "CSV") {
      exportContent = convertToCSV(dataToExport);
    } else {
      exportContent = JSON.stringify(dataToExport, null, 2);
    }

    const sizeBytes = Buffer.byteLength(exportContent, "utf8");

    const exportJob = await prisma.exportJob.create({
      data: {
        entityType,
        format,
        status: "COMPLETED",
        filters,
        rowCount,
        sizeBytes,
        createdById: admin.email,
        completedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        adminEmail: admin.email,
        adminName: admin.nameBn ?? "Admin",
        action: "DATA_EXPORTED",
        entityType: "ExportJob",
        entityId: exportJob.id,
        summary: `Exported ${rowCount} rows from ${entityType} in ${format} format (${sizeBytes} bytes)`,
        severity: "info",
      },
    });

    return NextResponse.json({
      ok: true,
      exportJob,
      content: exportContent,
      filename: `thoughts_whatever_${entityType.toLowerCase()}_${new Date().toISOString().split("T")[0]}.${format.toLowerCase()}`,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
