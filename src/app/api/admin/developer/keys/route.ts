import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function hashKey(plain: string): string {
  return crypto.createHash("sha256").update(plain).digest("hex");
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const keys = await prisma.aPIKey.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      scopes: true,
      lastUsedAt: true,
      expiresAt: true,
      revoked: true,
      createdAt: true,
      createdBy: true,
    },
  });

  return NextResponse.json({ ok: true, keys });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, scopes, expiresInDays } = body;

    if (!name || !scopes || !Array.isArray(scopes) || scopes.length === 0) {
      return NextResponse.json({ ok: false, error: "Name and at least one scope are required" }, { status: 400 });
    }

    const randomBytes = crypto.randomBytes(24).toString("base64url");
    const secretKey = `tw_live_${randomBytes}`;
    const keyPrefix = secretKey.substring(0, 12);
    const keyHash = hashKey(secretKey);

    let expiresAt: Date | null = null;
    if (expiresInDays && Number(expiresInDays) > 0) {
      expiresAt = new Date(Date.now() + Number(expiresInDays) * 24 * 60 * 60 * 1000);
    }

    const key = await prisma.aPIKey.create({
      data: {
        name,
        keyPrefix,
        keyHash,
        scopes,
        expiresAt,
        createdBy: admin.email,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        adminEmail: admin.email,
        adminName: admin.nameBn ?? "Admin",
        action: "API_KEY_CREATED",
        entityType: "APIKey",
        entityId: key.id,
        summary: `Created API key "${key.name}" with scopes: ${scopes.join(", ")}`,
        severity: "warning",
      },
    });

    return NextResponse.json({
      ok: true,
      key: {
        id: key.id,
        name: key.name,
        keyPrefix: key.keyPrefix,
        scopes: key.scopes,
        expiresAt: key.expiresAt,
        createdAt: key.createdAt,
      },
      secretKey, // Only displayed once on creation
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get("id");
    if (!keyId) {
      return NextResponse.json({ ok: false, error: "Missing key ID" }, { status: 400 });
    }

    const key = await prisma.aPIKey.update({
      where: { id: keyId },
      data: { revoked: true },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        adminEmail: admin.email,
        adminName: admin.nameBn ?? "Admin",
        action: "API_KEY_REVOKED",
        entityType: "APIKey",
        entityId: key.id,
        summary: `Revoked API key "${key.name}"`,
        severity: "warning",
      },
    });

    return NextResponse.json({ ok: true, message: "Key revoked successfully" });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
