import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const incidents = await prisma.incident.findMany({
    orderBy: [{ status: "asc" }, { detectedAt: "desc" }],
  });

  const activeCount = incidents.filter((i) => i.status !== "RESOLVED").length;
  const criticalCount = incidents.filter((i) => i.severity === "CRITICAL" && i.status !== "RESOLVED").length;
  const resolvedCount = incidents.filter((i) => i.status === "RESOLVED").length;

  return NextResponse.json({
    ok: true,
    summary: {
      activeCount,
      criticalCount,
      resolvedCount,
      totalCount: incidents.length,
    },
    incidents,
  });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, severity, affectedArea, assignedTo } = body;

    if (!title || !affectedArea) {
      return NextResponse.json({ ok: false, error: "Title and affected area are required" }, { status: 400 });
    }

    const timeline = [
      {
        timestamp: new Date().toISOString(),
        message: `Incident declared by ${admin.nameBn ?? admin.email}`,
        author: admin.email,
      },
    ];

    const incident = await prisma.incident.create({
      data: {
        title,
        description,
        severity: severity || "WARNING",
        status: "DETECTED",
        affectedArea,
        assignedTo: assignedTo || admin.email,
        timeline,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        adminEmail: admin.email,
        adminName: admin.nameBn ?? "Admin",
        action: "INCIDENT_CREATED",
        entityType: "Incident",
        entityId: incident.id,
        summary: `Created operational incident: "${incident.title}" (${incident.severity})`,
        severity: incident.severity === "CRITICAL" ? "critical" : "warning",
      },
    });

    return NextResponse.json({ ok: true, incident });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
