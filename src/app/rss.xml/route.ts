import { prisma } from "@/lib/prisma";
import { PUBLISHED } from "@/lib/pieces";
import { publishedBlobPrefixes, usablePrefix } from "@/lib/blob-prefix";
import { KIND_META } from "@/lib/nav";
import { absoluteCoverUrl, coverMime } from "@/lib/images";
import { absoluteUrl, siteConfig } from "@/lib/utils";

/**
 * /rss.xml — advertised from the root layout's `alternates.types`.
 *
 * The feed carries excerpts, not full bodies. That is a deliberate choice
 * rather than an oversight: `bodyBn` is the largest column in the table and
 * the same rule that keeps it off list queries applies here. A reader who
 * wants the whole রচনা is one click away, and the click is worth having.
 */

const ITEMS = 30;

/**
 * Served fresh on every request, then held by the CDN for an hour — see the
 * `Cache-Control` on the response below, which is what actually governs
 * staleness here.
 *
 * `force-dynamic` is load-bearing and not an oversight: 9799413 added it so a
 * Vercel build cannot fail on database access. It also means this route has no
 * ISR cache, so a `revalidate` export would be dead config and
 * `revalidatePath("/rss.xml")` cannot pull the feed forward — a publish shows
 * up when the CDN entry expires.
 */
export const dynamic = "force-dynamic";

/**
 * XML escaping, applied to every interpolated value.
 *
 * CDATA would be the lazier option, but a title containing "]]>" — not
 * impossible in a piece about typography or code — would break the document
 * silently. Escaping the five predefined entities cannot.
 */
function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** RFC 822 date, which is what RSS 2.0 requires. `toUTCString` emits exactly that. */
function rfc822(date: Date) {
  return date.toUTCString();
}

/**
 * Existence and mime of each cover, without the bytes.
 *
 * The enclosure needs two facts — does a cover exist, and what is its mime —
 * and neither needs the image. Selecting the column outright pulled up to 30
 * base64 blobs (~9 MB on today's data) across the wire to compute a filename
 * extension, which is the same mistake `cardSelect` exists to prevent.
 */
export async function GET() {
  const pieces = await prisma.piece.findMany({
    where: PUBLISHED,
    select: {
      slug: true,
      kind: true,
      titleBn: true,
      titleEn: true,
      dekBn: true,
      excerptBn: true,
      publishedAt: true,
      updatedAt: true,
      authors: { select: { nameBn: true } },
      tags: { select: { labelBn: true } },
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: ITEMS,
  });

  const covers = await publishedBlobPrefixes("coverImage", pieces.map((p) => p.slug));

  const self = absoluteUrl("/rss.xml");
  const updated = pieces[0]?.publishedAt ?? new Date();

  const items = pieces
    .map((piece) => {
      const link = absoluteUrl(
        `${KIND_META[piece.kind].path}/${encodeURIComponent(piece.slug)}`,
      );
      const summary = piece.excerptBn || piece.dekBn || "";
      const about = piece.authors.map((a) => a.nameBn).join(", ");
      const description = about ? `${about} — ${summary}` : summary;
      const categories = [
        KIND_META[piece.kind].labelBn,
        ...piece.tags.map((t) => t.labelBn),
      ]
        .map((label) => `      <category>${esc(label)}</category>`)
        .join("\n");

      const cover = covers.get(piece.slug);
      // A prefix cut mid-URL is not safe to publish; `usablePrefix` returns null
      // for one. That falls back to the /api/cover path, which serves the same
      // bytes and is always correct, at the cost of a generic mime.
      const usable = usablePrefix(cover);

      return [
        "    <item>",
        `      <title>${esc(piece.titleBn)}</title>`,
        `      <link>${esc(link)}</link>`,
        // isPermaLink="true" is the default, and the link is stable unless the
        // slug is renamed — at which point the piece is genuinely a new URL.
        `      <guid isPermaLink="true">${esc(link)}</guid>`,
        `      <pubDate>${rfc822(piece.publishedAt ?? piece.updatedAt)}</pubDate>`,
        `      <description>${esc(description)}</description>`,
        cover
          ? `      <enclosure url="${esc(
              absoluteCoverUrl("piece", piece.slug, usable),
            )}" type="${esc(coverMime(usable))}" />`
          : null,
        categories || null,
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(siteConfig.name)}</title>
    <link>${esc(absoluteUrl("/"))}</link>
    <description>${esc(siteConfig.tagline)}</description>
    <language>bn</language>
    <lastBuildDate>${rfc822(updated)}</lastBuildDate>
    <atom:link href="${esc(self)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
