import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { readSession } from "@/lib/auth";

export type AuditSeverity = "info" | "warning" | "critical";

export interface AuditLogInput {
  action: string;
  entityType?: string;
  entityId?: string;
  entitySlug?: string;
  summary: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  severity?: AuditSeverity;
  adminId?: string;
  adminEmail?: string;
  adminName?: string;
}

export async function logAuditEvent(input: AuditLogInput): Promise<void> {
  try {
    let adminId = input.adminId;
    let adminEmail = input.adminEmail || "";
    let adminName = input.adminName;

    if (!adminId) {
      const session = readSession();
      if (session) {
        adminId = session.sub;
        adminEmail = session.email || adminEmail;
        const admin = await prisma.adminUser.findUnique({
          where: { id: session.sub },
          select: { nameBn: true, email: true },
        });
        adminName = admin?.nameBn ?? undefined;
        adminEmail = admin?.email ?? adminEmail;
      }
    }

    if (!adminId) {
      console.warn("[AuditLog] Skipping — no admin identity resolved for action:", input.action);
      return;
    }

    let ipAddress = "unknown";
    let userAgent: string | undefined = undefined;

    try {
      const headerStore = headers();
      ipAddress =
        headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headerStore.get("x-real-ip") ||
        "unknown";
      userAgent = headerStore.get("user-agent") || undefined;
    } catch {
      // Header inspection safe fallback if outside request context
    }

    await prisma.auditLog.create({
      data: {
        adminId,
        adminEmail,
        adminName: adminName ?? null,
        action: input.action,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        entitySlug: input.entitySlug ?? null,
        summary: input.summary,
        changes: input.changes ?? undefined,
        metadata: input.metadata ?? undefined,
        ipAddress,
        userAgent: userAgent ?? null,
        severity: input.severity ?? "info",
      },
    });

    // Auto-backup database on mutation actions (piece, series, author, tag, import, etc.)
    if (!input.action.startsWith("admin.login") && !input.action.startsWith("admin.logout")) {
      import("@/lib/system/backup/auto-backup")
        .then((m) => m.triggerAutoBackup(input.action))
        .catch((e) => console.error("[AutoBackup] Trigger failed:", e));
    }
  } catch (err) {
    console.error("[AuditLog] Failed to write audit event:", err);
  }
}

export function auditPieceAction(
  action: "create" | "update" | "delete" | "publish" | "unpublish" | "archive",
  piece: { id: string; slug: string; titleBn: string },
  extra?: { changes?: Record<string, any>; metadata?: Record<string, any> }
) {
  const summaryMap: Record<string, string> = {
    create: `Created piece "${piece.titleBn}"`,
    update: `Updated piece "${piece.titleBn}"`,
    delete: `Deleted piece "${piece.titleBn}"`,
    publish: `Published piece "${piece.titleBn}"`,
    unpublish: `Unpublished piece "${piece.titleBn}"`,
    archive: `Archived piece "${piece.titleBn}"`,
  };
  return logAuditEvent({
    action: `piece.${action}`,
    entityType: "Piece",
    entityId: piece.id,
    entitySlug: piece.slug,
    summary: summaryMap[action] || `Piece ${action} "${piece.titleBn}"`,
    severity: action === "delete" ? "warning" : "info",
    ...extra,
  });
}

export function auditSeriesAction(
  action: "create" | "update" | "delete" | "reorder",
  series: { id: string; slug: string; titleBn: string },
  extra?: { changes?: Record<string, any>; metadata?: Record<string, any> }
) {
  return logAuditEvent({
    action: `series.${action}`,
    entityType: "Series",
    entityId: series.id,
    entitySlug: series.slug,
    summary: `${action.charAt(0).toUpperCase() + action.slice(1)} series "${series.titleBn}"`,
    severity: action === "delete" ? "warning" : "info",
    ...extra,
  });
}

export function auditAuthAction(
  action: "login" | "logout" | "login_failed",
  extra: { adminId?: string; adminEmail?: string; reason?: string }
) {
  return logAuditEvent({
    action: `admin.${action}`,
    summary:
      action === "login_failed"
        ? `Failed login attempt for ${extra.adminEmail || "unknown"}`
        : action === "login"
        ? `Admin ${extra.adminEmail} logged in`
        : `Admin ${extra.adminEmail} logged out`,
    severity: action === "login_failed" ? "warning" : "info",
    adminId: extra.adminId,
    adminEmail: extra.adminEmail,
    metadata: extra.reason ? { reason: extra.reason } : undefined,
  });
}

export function auditSystemAction(
  action: string,
  summary: string,
  extra?: { severity?: AuditSeverity; metadata?: Record<string, any> }
) {
  return logAuditEvent({
    action: `system.${action}`,
    entityType: "System",
    summary,
    severity: extra?.severity ?? "info",
    metadata: extra?.metadata,
  });
}
