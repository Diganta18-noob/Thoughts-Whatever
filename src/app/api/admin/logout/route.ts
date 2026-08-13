import { requireAdmin, clearAuthCookies } from "@/lib/auth";
import { auditAuthAction } from "@/lib/audit";
import { NextResponse } from "next/server";

import { guard } from "@/lib/admin-api";

export const runtime = "nodejs";

export async function POST() {
  const gate = await guard();
  if ("response" in gate) return gate.response;

  const admin = await requireAdmin();
    if (admin) { await auditAuthAction("logout", { adminId: admin.id, adminEmail: admin.email }); }
    await clearAuthCookies();
  return NextResponse.json({ ok: true });
}

