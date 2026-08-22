import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requirePermission, hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPermissionsMatrix, ROLE_LABELS } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";
import { logActivity } from "@/lib/activity";
import { AdminRole } from "@prisma/client";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const [members, totalCount] = await Promise.all([
    prisma.adminUser.findMany({
      select: {
        id: true,
        email: true,
        nameBn: true,
        role: true,
        status: true,
        lastActiveAt: true,
        lastLoginAt: true,
        createdAt: true,
        _count: {
          select: { refreshTokens: { where: { revoked: false, expiresAt: { gt: new Date() } } } },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.adminUser.count(),
  ]);

  const permissionsMatrix = getPermissionsMatrix();

  return NextResponse.json({
    ok: true,
    members: members.map((m) => ({
      ...m,
      activeSessionsCount: m._count.refreshTokens,
      roleMeta: ROLE_LABELS[m.role as AdminRole] || { labelBn: m.role, labelEn: m.role, description: "" },
    })),
    totalCount,
    permissionsMatrix,
    currentAdminRole: admin.role,
  });
}

export async function POST(req: NextRequest) {
  const admin = await requirePermission("users", "create");
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "forbidden", message: "Only administrators with user management authority can add team members." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { email, password, nameBn, role } = body;

    if (!email || !password || password.length < 8) {
      return NextResponse.json(
        { ok: false, error: "invalid_input", message: "Valid email and password (minimum 8 characters) required." },
        { status: 400 }
      );
    }

    const existing = await prisma.adminUser.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "email_exists", message: "A user with this email address already exists." },
        { status: 400 }
      );
    }

    // Only SUPER_ADMIN can assign SUPER_ADMIN role
    const assignedRole: AdminRole = role === "SUPER_ADMIN" && admin.role !== "SUPER_ADMIN" ? "ADMIN" : (role || "EDITOR");

    const passwordHash = await hashPassword(password);
    const newMember = await prisma.adminUser.create({
      data: {
        email: email.toLowerCase().trim(),
        passwordHash,
        nameBn: nameBn?.trim() || null,
        role: assignedRole,
        status: "active",
      },
      select: {
        id: true,
        email: true,
        nameBn: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    await logAuditEvent({
      action: "user.created",
      entityType: "AdminUser",
      entityId: newMember.id,
      summary: `Created team member ${newMember.email} with role ${newMember.role}`,
      adminId: admin.id,
      adminEmail: admin.email,
      severity: "info",
    });

    await logActivity({
      type: "user.created",
      summary: `Added new team member ${newMember.email} (${newMember.role})`,
      entityType: "AdminUser",
      entityId: newMember.id,
      actorId: admin.id,
      actorEmail: admin.email,
      actorName: admin.nameBn || "Admin",
    });

    return NextResponse.json({ ok: true, member: newMember });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const admin = await requirePermission("users", "update");
  if (!admin) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, role, status, nameBn, password } = body;

    if (!id) {
      return NextResponse.json({ ok: false, error: "id_required" }, { status: 400 });
    }

    const targetUser = await prisma.adminUser.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    // Prevent non-superadmin from modifying a Super Admin
    if (targetUser.role === "SUPER_ADMIN" && admin.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { ok: false, error: "forbidden", message: "Only Super Admins can modify Super Admin accounts." },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (role) {
      if (role === "SUPER_ADMIN" && admin.role !== "SUPER_ADMIN") {
        return NextResponse.json(
          { ok: false, error: "forbidden", message: "Only Super Admins can promote to Super Admin." },
          { status: 403 }
        );
      }
      updateData.role = role;
    }

    if (status) updateData.status = status;
    if (nameBn !== undefined) updateData.nameBn = nameBn;
    if (password && password.length >= 8) {
      updateData.passwordHash = await hashPassword(password);
    }

    const updated = await prisma.adminUser.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        nameBn: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    await logAuditEvent({
      action: "user.updated",
      entityType: "AdminUser",
      entityId: id,
      summary: `Updated team member ${targetUser.email} (Role: ${updated.role}, Status: ${updated.status})`,
      adminId: admin.id,
      adminEmail: admin.email,
    });

    return NextResponse.json({ ok: true, member: updated });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await requirePermission("users", "delete");
  if (!admin) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ ok: false, error: "id_required" }, { status: 400 });
  }

  if (id === admin.id) {
    return NextResponse.json(
      { ok: false, error: "self_deletion", message: "You cannot delete your own account." },
      { status: 400 }
    );
  }

  try {
    const target = await prisma.adminUser.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    if (target.role === "SUPER_ADMIN" && admin.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { ok: false, error: "forbidden", message: "Only Super Admins can remove a Super Admin." },
        { status: 403 }
      );
    }

    await prisma.adminUser.delete({ where: { id } });

    await logAuditEvent({
      action: "user.deleted",
      entityType: "AdminUser",
      entityId: id,
      summary: `Deleted team member ${target.email}`,
      severity: "warning",
      adminId: admin.id,
      adminEmail: admin.email,
    });

    return NextResponse.json({ ok: true, message: "Team member deleted" });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
