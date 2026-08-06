import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { ZodError, ZodType } from "zod";
import { requireAdmin } from "@/lib/auth";
import { flattenIssues } from "@/lib/validation";
import { KIND_META, piecePath, type PieceKindKey } from "@/lib/nav";

/**
 * Shared plumbing for the admin route handlers, so each one is only its own
 * database work.
 */

export type Admin = NonNullable<Awaited<ReturnType<typeof requireAdmin>>>;

/**
 * Every admin handler starts with this. Returns either the admin or the 401 to
 * send back — so a handler can write `if ("response" in gate) return gate.response`
 * and never accidentally continue without a session.
 */
export async function guard(): Promise<
  { admin: Admin } | { response: NextResponse }
> {
  const admin = await requireAdmin();
  if (!admin) {
    return {
      response: NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 },
      ),
    };
  }
  return { admin };
}

export function isValidCuid(id: string | null | undefined): boolean {
  if (!id || typeof id !== "string") return false;
  return /^c[a-z0-9]{24,}$/i.test(id);
}

export function badRequest(error: ZodError) {
  return NextResponse.json(
    { ok: false, fieldErrors: flattenIssues(error) },
    { status: 400 },
  );
}


export function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function ok<T extends object>(data: T = {} as T) {
  return NextResponse.json({ ok: true, ...data });
}

/** Parse a JSON body against a schema. Returns a response on any failure. */
export async function readBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<{ data: T } | { response: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { response: fail("অনুরোধটি পড়া যাচ্ছে না।") };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { response: badRequest(parsed.error) };
  return { data: parsed.data };
}

/**
 * Refresh every cached page a piece can appear on.
 *
 * Both the old and new slug are passed on a rename, because the old URL is
 * still sitting in someone's cache and should now 404 rather than serve a stale
 * copy. `/api/search-index` is in the list because the ⌘K index is a cached
 * route handler — without this, a new piece is live but unsearchable for five
 * minutes.
 */
export function revalidatePiece(opts: {
  kind: PieceKindKey;
  slug: string;
  previousSlug?: string | null;
  previousKind?: PieceKindKey | null;
}) {
  const paths = new Set<string>([
    "/",
    "/archive",
    "/series",
    "/authors",
    "/search",
    "/api/search-index",
    "/sitemap.xml",
    "/rss.xml",
    KIND_META[opts.kind].path,
    piecePath(opts.kind, opts.slug),
  ]);

  if (opts.previousKind) paths.add(KIND_META[opts.previousKind].path);

  if (opts.previousSlug && opts.previousSlug !== opts.slug) {
    paths.add(piecePath(opts.previousKind ?? opts.kind, opts.previousSlug));
  }
  if (opts.previousKind && opts.previousKind !== opts.kind) {
    paths.add(piecePath(opts.previousKind, opts.previousSlug ?? opts.slug));
  }

  for (const path of paths) revalidatePath(path);
}

/** For taxonomy edits, which change facet labels and counts but no article. */
export function revalidateTaxonomy() {
  for (const path of [
    "/",
    "/archive",
    "/authors",
    "/series",
    "/search",
    "/api/search-index",
    "/sitemap.xml",
    "/rss.xml",
  ]) {
    revalidatePath(path);
  }
}
