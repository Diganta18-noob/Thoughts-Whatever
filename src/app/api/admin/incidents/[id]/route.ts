import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const incidentId = params.id;
  const existing = await prisma.incident.findUnique({ where: { id: incidentId } });
  if (!existing) {
    return NextResponse.json({ ok: false, error: "Incident not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { status, resolution, rootCause, note } = body;

    const currentTimeline = (existing.timeline as Array<any>) || [];
    if (note) {
      currentTimeline.push({
        timestamp: new Date().toISOString(),
        message: note,
        author: admin.email,
      });
    }

    if (status && status !== existing.status) {
      currentTimeline.push({
        timestamp: new Date().toISOString(),
        message: `Status transitioned from ${existing.status} to ${status}`,
        author: admin.email,
      });
    }

    const updated = await prisma.incident.update({
      where: { id: incidentId },
      data: {
        ...(status ? { status } : {}),
        ...(resolution ? { resolution } : {}),
        ...(rootCause ? { rootCause } : {}),
        ...(status === "RESOLVED" ? { resolvedAt: new Date() } : {}),
        timeline: currentTimeline,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        adminEmail: admin.email,
        adminName: admin.nameBn ?? "Admin",
        action: status === "RESOLVED" ? "INCIDENT_RESOLVED" : "INCIDENT_UPDATED",
        entityType: "Incident",
        entityId: incidentId,
        summary: `Updated incident "${updated.title}" -> ${updated.status}`,
        severity: status === "RESOLVED" ? "info" : "warning",
      },
    });

    return NextResponse.json({ ok: true, incident: updated });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
