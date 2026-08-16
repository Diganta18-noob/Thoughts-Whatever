import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Reading just enough of a blob column to make a decision about it.
 *
 * `Piece.coverImage` and `Piece.ogImage` hold entire images as base64 data URIs
 * on legacy rows — up to 3.1 MB and 320 KB respectively. Two public read paths
 * need only a *fact* about those columns, never the bytes: the RSS feed needs
 * "does a cover exist, and what is its mime", and the article page needs "is
 * `ogImage` a real URL or a data URI to discard". Selecting the column to answer
 * either question is the exact mistake `cardSelect` exists to prevent, so both
 * read a bounded prefix instead.
 *
 * 512 bytes is chosen against both shapes: a data URI declares its mime in the
 * first ~30 characters, and a migrated Cloudinary URL fits whole with room to
 * spare.
 */
export const BLOB_PREFIX = 512;

/**
 * The two columns this is allowed to read, as SQL fragments.
 *
 * A closed map rather than a `Prisma.raw(column)` call: the identifier can then
 * never come from a caller's string, so there is nothing to sanitise.
 */
const COLUMNS = {
  coverImage: Prisma.sql`"coverImage"`,
  ogImage: Prisma.sql`"ogImage"`,
} as const;

/**
 * First `limit` characters of `column` for each published piece, keyed by slug.
 *
 * Prisma cannot project a substring of a column, so this is raw SQL. Rows whose
 * value is null or blank are absent from the map, which makes `map.has(slug)`
 * the existence signal.
 *
 * Only `PUBLISHED` rows are read. Both callers are public read paths, and it
 * keeps this consistent with the queries it runs beside — an unpublished piece's
 * artwork is not ours to hand out.
 */
export async function publishedBlobPrefixes(
  column: keyof typeof COLUMNS,
  slugs: string[],
  limit = BLOB_PREFIX,
): Promise<Map<string, string>> {
  const found = new Map<string, string>();
  if (slugs.length === 0) return found;

  // `::int` is required, not decorative: Prisma binds a JS number as `bigint`,
  // and Postgres has no `left(text, bigint)` — without the cast this fails at
  // runtime with 42883.
  const rows = await prisma.$queryRaw<Array<{ slug: string; prefix: string | null }>>`
    SELECT slug, left(${COLUMNS[column]}, ${limit}::int) AS prefix
    FROM "Piece"
    WHERE slug IN (${Prisma.join(slugs)}) AND status = 'PUBLISHED'
  `;

  for (const row of rows) {
    const value = row.prefix?.trim();
    if (value) found.set(row.slug, value);
  }
  return found;
}

/**
 * The prefix if it is safe to use as a value, `null` if it may be truncated.
 *
 * A prefix that exactly fills the budget was cut at an arbitrary point, so a URL
 * that long cannot be published — it would be a broken link. A data URI is
 * exempt because nothing downstream uses more of one than its leading
 * `data:image/webp;base64,`: the feed reads a mime out of it and the article
 * page discards it. Not reachable on any cover URL in the database today.
 */
export function usablePrefix(
  value: string | undefined,
  limit = BLOB_PREFIX,
): string | null {
  if (!value) return null;
  if (value.length >= limit && !value.startsWith("data:")) return null;
  return value;
}
