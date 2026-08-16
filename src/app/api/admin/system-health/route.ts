import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { checkHealth } from "@/lib/system/health";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const health = await checkHealth();
    return NextResponse.json(health, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Health check failed" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }
}
