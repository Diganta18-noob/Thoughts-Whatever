import { NextResponse } from "next/server";
import { requireAdmin, hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const exportData = searchParams.get("export");

  if (exportData === "true") {
    // Export site data as JSON backup
    const [pieces, series, authors, tags, subscribers] = await Promise.all([
      prisma.piece.findMany({
        include: {
          authors: { select: { slug: true, nameBn: true } },
          tags: { select: { slug: true, labelBn: true } },
          sources: true,
          timeline: true,
        },
      }),
      prisma.series.findMany(),
      prisma.author.findMany(),
      prisma.tag.findMany(),
      prisma.subscriber.findMany(),
    ]);

    const backup = {
      exportDate: new Date().toISOString(),
      pieces,
      series,
      authors,
      tags,
      subscribersCount: subscribers.length,
    };

    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="thoughts-whatever-backup-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  }

  const adminUsers = await prisma.adminUser.findMany({
    select: { id: true, email: true, nameBn: true, lastLoginAt: true, createdAt: true },
  });

  return NextResponse.json({ adminUsers });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, currentPassword, newPassword, email, nameBn } = body;

    if (action === "changePassword") {
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: "Please fill in all password fields." }, { status: 400 });
      }

      const user = await prisma.adminUser.findUnique({ where: { id: admin.id } });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const valid = await verifyPassword(currentPassword, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
      }

      const newHash = await hashPassword(newPassword);
      await prisma.adminUser.update({
        where: { id: admin.id },
        data: { passwordHash: newHash },
      });

      return NextResponse.json({ ok: true, message: "Password updated successfully." });
    }

    if (action === "addAdmin") {
      if (!email || !newPassword) {
        return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
      }

      const existing = await prisma.adminUser.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: "This email address is already registered." }, { status: 400 });
      }

      const passwordHash = await hashPassword(newPassword);
      await prisma.adminUser.create({
        data: {
          email,
          nameBn: nameBn || null,
          passwordHash,
        },
      });

      return NextResponse.json({ ok: true, message: "New admin account created successfully." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Failed in settings API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
