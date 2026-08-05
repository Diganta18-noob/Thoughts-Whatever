import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { checkHealth } from "@/lib/system/health";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const health = await checkHealth();
    return NextResponse.json(health);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Health check failed" }, { status: 500 });
  }
}
