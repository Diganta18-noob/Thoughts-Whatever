import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const passwordHash = await hashPassword("Indu@arun");
    const email = "admin@thoughts.whatever.com";

    const admin = await prisma.adminUser.upsert({
      where: { email },
      create: {
        email,
        passwordHash,
        nameBn: "অ্যাডমিন",
      },
      update: {
        passwordHash,
        nameBn: "অ্যাডমিন",
      },
      select: { id: true, email: true, createdAt: true },
    });

    return NextResponse.json({
      ok: true,
      message: "Admin account initialized successfully.",
      admin,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Failed to initialize admin account",
      },
      { status: 500 },
    );
  }
}

export async function POST() {
  return GET();
}
