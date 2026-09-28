import { prisma } from "@/lib/prisma";
import { guard } from "@/lib/admin-api";

/**
 * The subscriber list as CSV.
 *
 * Editorial letters are sent by the publisher's mail tool. Export only
 * confirmed, active subscribers.
 */

export const runtime = "nodejs";

/** RFC 4180: quote every field, double any inner quote. */
function csvCell(value: string | null | undefined): string {
  return `"${(value ?? "").replace(/"/g, '""')}"`;
}

export async function GET() {
  const gate = await guard();
  if ("response" in gate) return gate.response;

  const subscribers = await prisma.subscriber.findMany({
    where: { unsubscribedAt: null, confirmed: true },
    select: { email: true, nameBn: true, source: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const rows = [
    ["email", "name", "source", "joined"].join(","),
    ...subscribers.map((s) =>
      [
        csvCell(s.email),
        csvCell(s.nameBn),
        csvCell(s.source),
        csvCell(s.createdAt.toISOString().slice(0, 10)),
      ].join(","),
    ),
  ];

  // Leading BOM (written as an escape, never pasted) so Excel opens Bengali
  // names as UTF-8 instead of mojibake.
  const body = `\uFEFF${rows.join("\r\n")}\r\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="chithi-subscribers.csv"',
      "Cache-Control": "no-store",
    },
  });
}
