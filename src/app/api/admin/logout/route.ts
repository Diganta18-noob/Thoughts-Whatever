import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth";
import { guard } from "@/lib/admin-api";

export const runtime = "nodejs";

export async function POST() {
  const gate = await guard();
  if ("response" in gate) return gate.response;

  await clearAuthCookies();
  return NextResponse.json({ ok: true });
}

