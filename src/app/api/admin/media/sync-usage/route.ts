import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { syncAllMediaUsage } from "@/lib/media";

export async function POST() {
  const admin = await requirePermission("media", "update");
  if (!admin) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  try {
    const result = await syncAllMediaUsage();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
