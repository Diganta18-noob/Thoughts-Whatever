import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [activeSessions, failedLogins24h, recentSecurityAudits, totalAdmins] = await Promise.all([
    prisma.refreshToken.findMany({
      where: {
        revoked: false,
        expiresAt: { gt: now },
      },
      include: {
        adminUser: {
          select: { id: true, email: true, nameBn: true, role: true },
        },
      },
      orderBy: { lastUsedAt: "desc" },
    }),
    prisma.auditLog.count({
      where: {
        action: "admin.login_failed",
        createdAt: { gte: oneDayAgo },
      },
    }),
    prisma.auditLog.findMany({
      where: {
        OR: [
          { action: { startsWith: "admin." } },
          { action: { startsWith: "user." } },
          { severity: { in: ["warning", "critical"] } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.adminUser.count(),
  ]);

  // Calculate Security Score (0-100)
  let score = 100;
  const issues: string[] = [];

  if (failedLogins24h > 5) {
    score -= 15;
    issues.push(`${failedLogins24h} failed login attempts detected in last 24h.`);
  } else if (failedLogins24h > 0) {
    score -= 5;
    issues.push(`${failedLogins24h} failed login attempt in last 24h.`);
  }

  if (activeSessions.length > totalAdmins * 4) {
    score -= 10;
    issues.push(`Elevated number of active sessions (${activeSessions.length}) detected.`);
  }

  return NextResponse.json({
    ok: true,
    securityScore: Math.max(score, 0),
    issues,
    metrics: {
      activeSessionsCount: activeSessions.length,
      failedLogins24h,
      totalAdmins,
      jwtAuthStatus: "ACTIVE (HS256 with Rotation)",
      cookiePolicy: "HTTPOnly, SameSite=Lax, Auto-Revocation",
    },
    activeSessions: activeSessions.map((s) => ({
      id: s.id,
      adminEmail: s.adminUser.email,
      adminRole: s.adminUser.role,
      userAgent: s.userAgent || "Unknown Device",
      ipAddress: s.ipAddress || "Unknown IP",
      lastUsedAt: s.lastUsedAt,
      expiresAt: s.expiresAt,
      isCurrent: false, // will be matched on client
    })),
    recentSecurityAudits,
  });
}

export async function DELETE(req: NextRequest) {
  const admin = await requirePermission("security", "manage");
  if (!admin) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const revokeAll = searchParams.get("all") === "true";

    if (revokeAll) {
      await prisma.refreshToken.updateMany({
        where: { revoked: false },
        data: { revoked: true },
      });

      await logAuditEvent({
        action: "security.sessions_revoked_all",
        summary: `Revoked all active sessions across all accounts`,
        severity: "warning",
        adminId: admin.id,
        adminEmail: admin.email,
      });

      return NextResponse.json({ ok: true, message: "All sessions have been revoked." });
    }

    if (sessionId) {
      await prisma.refreshToken.update({
        where: { id: sessionId },
        data: { revoked: true },
      });

      await logAuditEvent({
        action: "security.session_revoked",
        summary: `Revoked active session ${sessionId}`,
        severity: "info",
        adminId: admin.id,
        adminEmail: admin.email,
      });

      return NextResponse.json({ ok: true, message: "Session revoked successfully." });
    }

    return NextResponse.json({ ok: false, error: "invalid_params" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
