import { NextResponse } from "next/server";
import { publishDuePieces } from "@/lib/scheduled-publication";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized cron trigger" }, { status: 401 });
  }

  const published = await publishDuePieces();
  console.info("Scheduled publication completed", { published });
  return NextResponse.json({ ok: true, published });
}
