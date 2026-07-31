import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST only, on purpose.
 *
 * Mail clients and link scanners fetch every URL in a message before the reader
 * ever sees it. If unsubscribing were a GET, a share of the list would be
 * removed by software that was only checking for malware. So the link in the
 * email opens a page, and the page asks once.
 *
 * Replies carry a `code` so the browser can show the sentence in whichever
 * language the interface is set to; `messageBn` stays for consumers with no UI.
 */

export const runtime = "nodejs";

export async function POST(request: Request) {
  let token = "";
  try {
    const body = (await request.json()) as { token?: unknown };
    token = typeof body.token === "string" ? body.token.trim() : "";
  } catch {
    // fall through to the empty-token reply
  }

  if (!token) {
    return NextResponse.json(
      { ok: false, code: "missingToken", messageBn: "লিংকটি সম্পূর্ণ নয়।" },
      { status: 400 },
    );
  }

  const subscriber = await prisma.subscriber.findUnique({
    where: { unsubscribeToken: token },
    select: { id: true, unsubscribedAt: true },
  });

  if (!subscriber) {
    return NextResponse.json(
      { ok: false, code: "unknownToken", messageBn: "এই লিংকটি আর কাজ করছে না।" },
      { status: 404 },
    );
  }

  if (!subscriber.unsubscribedAt) {
    await prisma.subscriber.update({
      where: { id: subscriber.id },
      data: { unsubscribedAt: new Date() },
    });
  }

  return NextResponse.json({
    ok: true,
    code: "unsubscribed",
    messageBn: "হয়ে গেল। আর চিঠি যাবে না।",
  });
}
