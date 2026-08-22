import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const admin = await requirePermission("seo", "manage");
  if (!admin) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { linkId, action } = body;

    if (!linkId) {
      return NextResponse.json({ ok: false, error: "linkId_required" }, { status: 400 });
    }

    if (action === "ignore") {
      await prisma.brokenLink.update({
        where: { id: linkId },
        data: { ignored: true },
      });
      return NextResponse.json({ ok: true, message: "Link ignored" });
    }

    if (action === "delete") {
      await prisma.brokenLink.delete({
        where: { id: linkId },
      });
      return NextResponse.json({ ok: true, message: "Link record deleted" });
    }

    return NextResponse.json({ ok: false, error: "unknown_action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
