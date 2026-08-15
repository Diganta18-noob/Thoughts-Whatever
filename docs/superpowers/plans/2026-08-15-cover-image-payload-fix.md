# Cover Image Payload Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop serving cover images as base64 data URIs so pages drop from 4.2 MB to under 100 KB and the home page stops rendering empty.

**Architecture:** Cover images are currently stored in Postgres as base64 data URIs (133 KB – 3.1 MB per row) and inlined into every HTML and RSC payload. The fix has two halves. First, a **code-side safety net**: every cover reference resolves to the already-existing `/api/cover/{owner}/{slug}` endpoint instead of an inline blob, and blob columns stop being pulled into list queries at all. Second, a **data-side migration**: the offending rows (13 published pieces and 3 of 4 series, as measured) move to Cloudinary (credentials are already configured), after which the column holds a short URL and the safety net becomes a no-op for them.

The code-side half lands first and independently. It fixes production without touching a single row of data, which means it is reversible by `git revert` alone.

**Tech Stack:** Next.js 14 App Router, Prisma 6 + Supabase Postgres (pgbouncer pooler), Cloudinary, Jest (`jest-environment-node`), tsx for scripts, sharp for local image probing.

## Global Constraints

- Do **not** run `prisma migrate` or `prisma db push`. The schema is unchanged by this plan; only row values change.
- Do **not** delete or overwrite a `coverImage` value until its Cloudinary replacement has been fetched and verified to return HTTP 200.
- `/api/cover/{owner}/{slug}` must never redirect to a URL that starts with `/api/cover` — that is an infinite redirect loop.
- Bengali slugs are percent-encoded in URLs. Every slug read from `params` must go through `decodeURIComponent`, and every slug written into a URL must go through `encodeURIComponent`.
- Tests live in `src/**/__tests__/*.test.ts` and run under `jest-environment-node` with the `@/` → `src/` alias. Run with `npx jest <path>`.
- Commit after every task. Do not batch tasks into one commit.
- Measured baseline to beat (recorded 2026-08-15 against `https://thoughts-whatever.vercel.app`):

  | Route | wire size | raw | base64 bytes inside |
  |---|---|---|---|
  | `/documentary` | 4,175,753 | 9,123,718 | 9,036,724 (99%) |
  | `/archive` | 1,984,542 | 3,028,381 | 2,905,647 (96%) |
  | `/writing/crime-and-punishment-3` (RSC) | 908,919 | 2,360,680 | 2,332,309 (98.8%) |
  | `/` | 9,577 | 49,657 | 0 — **renders empty, 0 article links** |

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `src/lib/cover-resolver.ts` | Pure function turning a stored cover value into a discriminated union (`data` / `remote` / `missing`). No I/O, fully unit-testable. | Create |
| `src/lib/__tests__/cover-resolver.test.ts` | Tests for the resolver, including the self-reference loop guard. | Create |
| `src/app/api/cover/[owner]/[slug]/route.ts` | Thin HTTP shell over the resolver: serves decoded bytes for data URIs, redirects for remote URLs, 404s otherwise. | Modify |
| `src/lib/images.ts` | `coverSrc` — never returns a `data:` URI to the render tree. | Modify |
| `src/lib/__tests__/images.test.ts` | Tests for `coverSrc` / `isOptimizable`. | Create |
| `src/lib/pieces.ts` | Query layer — stops selecting blob columns in list/card queries; adds cheap dimension columns. | Modify |
| `next.config.js` | Per-route `Cdn-Cache-Control` so the cover endpoint is CDN-cached for a year, not 5 minutes. | Modify |
| `src/app/rss.xml/route.ts` | Feed enclosures must be absolute URLs, never data URIs. | Modify |
| `src/app/api/admin/upload/route.ts` | Fail loudly instead of silently persisting a data URI. | Modify |
| `scripts/migrate-to-cloudinary.ts` | Repair the existing migration: dry-run, dimension write-back, post-upload verification. | Modify |
| `scripts/backfill-image-dimensions.ts` | Repair with `sharp`; handle data URIs as well as remote URLs. | Modify |
| `src/app/page.tsx` | Stop silently swallowing query failures into empty sections. | Modify |
| `src/app/archive/page.tsx` | `prefetch={false}` on the ~30 filter chips. | Modify |
| `docs/PERFORMANCE_MEASUREMENTS.md` | Record before/after numbers. | Modify |

---

### Task 1: Cover resolver + universal cover endpoint

The endpoint already exists and already serves data URIs with `immutable` caching. Two things are missing: it cannot handle a stored value that is a normal URL (needed by Task 3, which stops selecting the raw column), and its CDN caching is capped at 300 s by the catch-all header rule in `next.config.js`.

**Files:**
- Create: `src/lib/cover-resolver.ts`
- Create: `src/lib/__tests__/cover-resolver.test.ts`
- Modify: `src/app/api/cover/[owner]/[slug]/route.ts`
- Modify: `next.config.js` (headers array)

**Interfaces:**
- Consumes: `normalizeMime` from `@/lib/images` (already exported).
- Produces: `resolveCover(stored: string | null | undefined): CoverResolution` where
  `CoverResolution = { kind: "data"; mime: string; bytes: Buffer } | { kind: "remote"; url: string } | { kind: "missing" }`.
  Task 3 relies on the endpoint accepting both storage shapes.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/cover-resolver.test.ts`:

```ts
import { describe, it, expect } from "@jest/globals";
import { resolveCover } from "@/lib/cover-resolver";

// 1x1 transparent PNG
const PNG_B64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AAAwAB/AF/AAAAAABJRU5ErkJggg==";

describe("resolveCover", () => {
  it("returns missing for empty, null, and whitespace input", () => {
    expect(resolveCover(null).kind).toBe("missing");
    expect(resolveCover(undefined).kind).toBe("missing");
    expect(resolveCover("   ").kind).toBe("missing");
  });

  it("decodes a base64 data URI into bytes", () => {
    const r = resolveCover(`data:image/png;base64,${PNG_B64}`);
    expect(r.kind).toBe("data");
    if (r.kind !== "data") throw new Error("expected data");
    expect(r.mime).toBe("image/png");
    expect(r.bytes.byteLength).toBeGreaterThan(20);
    expect(r.bytes.subarray(1, 4).toString("ascii")).toBe("PNG");
  });

  it("normalises legacy mime aliases", () => {
    const r = resolveCover(`data:image/jpg;base64,${PNG_B64}`);
    if (r.kind !== "data") throw new Error("expected data");
    expect(r.mime).toBe("image/jpeg");
  });

  it("rejects a non-image data URI", () => {
    expect(resolveCover("data:text/html;base64,PGgxPmhpPC9oMT4=").kind).toBe("missing");
  });

  it("rejects a data URI whose payload decodes to nothing", () => {
    expect(resolveCover("data:image/png;base64,").kind).toBe("missing");
  });

  it("treats an https value as a remote redirect target", () => {
    const r = resolveCover("https://res.cloudinary.com/demo/image/upload/a.webp");
    expect(r).toEqual({ kind: "remote", url: "https://res.cloudinary.com/demo/image/upload/a.webp" });
  });

  it("treats a site-relative value as a remote redirect target", () => {
    expect(resolveCover("/covers/x.jpg")).toEqual({ kind: "remote", url: "/covers/x.jpg" });
  });

  it("refuses to redirect to the cover endpoint itself (loop guard)", () => {
    expect(resolveCover("/api/cover/piece/abc").kind).toBe("missing");
    expect(resolveCover("https://example.com/api/cover/piece/abc").kind).toBe("missing");
    expect(resolveCover("//evil.example.com/api/cover/piece/abc").kind).toBe("missing");
  });

  it("rejects protocol-relative values", () => {
    expect(resolveCover("//evil.example.com/x.jpg").kind).toBe("missing");
  });

  it("rejects junk that is neither a data URI nor a URL", () => {
    expect(resolveCover("not-a-url").kind).toBe("missing");
    expect(resolveCover("javascript:alert(1)").kind).toBe("missing");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/lib/__tests__/cover-resolver.test.ts`
Expected: FAIL — `Cannot find module '@/lib/cover-resolver'`.

- [ ] **Step 3: Write the resolver**

Create `src/lib/cover-resolver.ts`:

```ts
import { normalizeMime } from "@/lib/images";

/**
 * `bytes` is `Buffer<ArrayBuffer>` rather than a bare `Buffer`: the default
 * `ArrayBufferLike` type parameter is not assignable to `BodyInit`, so
 * `new Response(bytes)` in the route would not typecheck.
 */
export type CoverResolution =
  | { kind: "data"; mime: string; bytes: Buffer<ArrayBuffer> }
  | { kind: "remote"; url: string }
  | { kind: "missing" };

const DATA_URI = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,(.*)$/is;

/** The endpoint must never redirect to itself. */
function isSelfReference(value: string): boolean {
  if (value.startsWith("/api/cover")) return true;
  try {
    return new URL(value).pathname.startsWith("/api/cover");
  } catch {
    return false;
  }
}

/**
 * Turn a stored `coverImage` column value into something servable.
 *
 * Legacy rows hold a full base64 data URI (hundreds of KB); migrated rows hold
 * a Cloudinary URL. Both shapes reach this endpoint, so both are handled here
 * rather than at each call site.
 */
export function resolveCover(stored: string | null | undefined): CoverResolution {
  const value = stored?.trim();
  if (!value) return { kind: "missing" };

  const match = DATA_URI.exec(value);
  if (match) {
    const mime = normalizeMime(match[1]!);
    if (!mime.startsWith("image/")) return { kind: "missing" };
    const bytes = Buffer.from(match[2]!, "base64");
    if (bytes.byteLength === 0) return { kind: "missing" };
    return { kind: "data", mime, bytes };
  }

  // A protocol-relative value would redirect off-origin to an arbitrary host,
  // and `new URL()` cannot parse it, so the loop guard below would miss it too.
  if (value.startsWith("//")) return { kind: "missing" };

  const isUrl = /^https?:\/\//i.test(value) || value.startsWith("/");
  if (!isUrl || isSelfReference(value)) return { kind: "missing" };

  return { kind: "remote", url: value };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/lib/__tests__/cover-resolver.test.ts`
Expected: PASS, 10 tests.

- [ ] **Step 5: Rewrite the route over the resolver**

Replace the body of `src/app/api/cover/[owner]/[slug]/route.ts` with:

```ts
import { prisma } from "@/lib/prisma";
import { resolveCover } from "@/lib/cover-resolver";

const MISS = {
  status: 404,
  headers: { "Cache-Control": "public, max-age=60" },
} as const;

const IMMUTABLE = "public, max-age=31536000, s-maxage=31536000, immutable";

function decodeSlug(raw: string) {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

async function findCover(owner: string, rawSlug: string) {
  const slug = decodeSlug(rawSlug);

  if (owner === "piece") {
    const piece = await prisma.piece.findFirst({
      where: { slug },
      select: { coverImage: true },
    });
    return piece?.coverImage ?? null;
  }

  if (owner === "series") {
    const series = await prisma.series.findFirst({
      where: { slug },
      select: { coverImage: true, pieces: { select: { coverImage: true }, take: 1 } },
    });
    if (!series) return null;
    return series.coverImage || series.pieces[0]?.coverImage || null;
  }

  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: { owner: string; slug: string } },
) {
  const stored = await findCover(params.owner, params.slug);
  const resolved = resolveCover(stored);

  if (resolved.kind === "missing") return new Response(null, MISS);

  if (resolved.kind === "remote") {
    return new Response(null, {
      status: 307,
      headers: { Location: resolved.url, "Cache-Control": IMMUTABLE },
    });
  }

  return new Response(resolved.bytes, {
    headers: {
      "Content-Type": resolved.mime,
      "Content-Length": String(resolved.bytes.byteLength),
      "Cache-Control": IMMUTABLE,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
```

- [ ] **Step 6: Give the cover route sole ownership of its cache headers**

In `next.config.js`, the catch-all `source: "/:path*"` rule sets `CDN-Cache-Control: public, max-age=300, s-maxage=300, ...`, which applies to `/api/cover/*` too and caps CDN caching at 5 minutes.

The obvious fix — adding a `CDN-Cache-Control: immutable` entry to the existing `/api/cover/:path*` block — is **wrong**, and this was verified empirically: Next.js *appends* config headers to a Route Handler's own response headers rather than replacing them. A 404 from this route sets `Cache-Control: public, max-age=60` itself, so it would ship two conflicting `Cache-Control` lines and, worse, become CDN-cacheable for a year. A cover added later would sit behind a cached 404.

Config headers cannot vary by status code, so exactly one layer must own them: the route. Two changes.

First, exclude the cover route from the catch-all and **delete the `/api/cover/:path*` block entirely**. The catch-all's `source` becomes:

```js
        source: "/:path((?!api/cover).*)",
```

Leave every header inside the catch-all untouched — HSTS, `X-Frame-Options`, `Referrer-Policy` and the rest must still apply to every other route.

Second, in `src/app/api/cover/[owner]/[slug]/route.ts`, set both cache headers per response so a miss is cached briefly and a hit is cached forever:

```ts
const MISS = {
  status: 404,
  headers: {
    "Cache-Control": "public, max-age=60",
    "CDN-Cache-Control": "public, max-age=60",
  },
} as const;

const IMMUTABLE = "public, max-age=31536000, s-maxage=31536000, immutable";
```

and give both the 307 and the 200 response `"Cache-Control": IMMUTABLE` **and** `"CDN-Cache-Control": IMMUTABLE`.

Verify all three cases with `curl -sI`, counting the header lines rather than eyeballing them:
- a real cover → exactly one `Cache-Control`, containing `immutable`
- a missing cover → exactly one `Cache-Control`, containing `max-age=60`, and **not** `immutable`
- `/` → still carries `Strict-Transport-Security` and `X-Frame-Options` from the catch-all

That last check matters: `:path((?!api/cover).*)` must still match the root path. If it does not, report it rather than working around it.

- [ ] **Step 7: Verify the endpoint locally**

Run `npm run dev`, then in a second shell:

```bash
curl -sI "http://localhost:3000/api/cover/piece/crime-and-punishment-3" | grep -i "http/\|content-type\|content-length\|cache-control"
```

Expected: `200`, `Content-Type: image/webp`, `Content-Length: 212754`, `Cache-Control: ...immutable`.

```bash
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/api/cover/piece/does-not-exist"
```

Expected: `404`.

- [ ] **Step 8: Commit**

```bash
git add src/lib/cover-resolver.ts src/lib/__tests__/cover-resolver.test.ts "src/app/api/cover/[owner]/[slug]/route.ts" next.config.js
git commit -m "feat(cover): resolve covers through one endpoint for both data-URI and URL storage"
```

---

### Task 2: `coverSrc` never hands a data URI to the render tree

This is the single change that cuts page weight by ~99%. `coverSrc` currently returns the stored value verbatim, so a 283 KB data URI is inlined into HTML and the RSC payload. Inverting it means the browser gets a 40-byte path that `next/image` can optimize (`isOptimizable` already returns `true` for anything starting with `/`).

**Files:**
- Modify: `src/lib/images.ts:17-27` (`coverSrc`)
- Create: `src/lib/__tests__/images.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `coverSrc(owner: CoverOwner, slug: string, coverImage?: string | null): string` — note the return type narrows from `string | null` to `string`; it always yields a usable src. Task 3 depends on this non-null guarantee.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/images.test.ts`:

```ts
import { describe, it, expect } from "@jest/globals";
import { coverSrc, isOptimizable, coverMime, normalizeMime } from "@/lib/images";

describe("coverSrc", () => {
  it("proxies a data URI through the cover endpoint instead of inlining it", () => {
    const huge = `data:image/webp;base64,${"A".repeat(300_000)}`;
    const src = coverSrc("piece", "crime-and-punishment-3", huge);
    expect(src).toBe("/api/cover/piece/crime-and-punishment-3");
    expect(src.length).toBeLessThan(80);
  });

  it("percent-encodes Bengali slugs", () => {
    const src = coverSrc("piece", "রক্তকরবী", "data:image/webp;base64,AAAA");
    expect(src).toBe(`/api/cover/piece/${encodeURIComponent("রক্তকরবী")}`);
  });

  it("falls back to the endpoint when no cover is stored", () => {
    expect(coverSrc("piece", "x", null)).toBe("/api/cover/piece/x");
    expect(coverSrc("piece", "x", "   ")).toBe("/api/cover/piece/x");
  });

  it("passes a real CDN url straight through", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1/a.webp";
    expect(coverSrc("piece", "x", url)).toBe(url);
  });

  it("uses the series owner segment for series covers", () => {
    expect(coverSrc("series", "আনন্দমঠ", "data:image/webp;base64,AAAA")).toBe(
      `/api/cover/series/${encodeURIComponent("আনন্দমঠ")}`,
    );
  });
});

describe("isOptimizable", () => {
  it("optimizes the cover endpoint path", () => {
    expect(isOptimizable("/api/cover/piece/x")).toBe(true);
  });

  it("optimizes allow-listed remote hosts", () => {
    expect(isOptimizable("https://res.cloudinary.com/demo/a.webp")).toBe(true);
    expect(isOptimizable("https://evil.example.com/a.webp")).toBe(false);
  });
});

describe("mime helpers", () => {
  it("normalises aliases", () => {
    expect(normalizeMime("image/JPG")).toBe("image/jpeg");
  });

  it("reads the mime out of a data URI", () => {
    expect(coverMime("data:image/webp;base64,AAAA")).toBe("image/webp");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/lib/__tests__/images.test.ts`
Expected: FAIL — the first test receives the 300 KB data URI back instead of `/api/cover/piece/crime-and-punishment-3`.

- [ ] **Step 3: Invert `coverSrc`**

In `src/lib/images.ts`, replace the `coverSrc` function with:

```ts
/**
 * Resolve a cover to something safe to put in the render tree.
 *
 * Legacy rows store the whole image as a base64 data URI. Returning that
 * verbatim inlines hundreds of KB into every HTML and RSC payload, and
 * `next/image` cannot optimize a `data:` URI. So any data URI is swapped for
 * the `/api/cover` path, which is CDN-cacheable, browser-cacheable, and
 * optimizable. Real URLs pass through untouched.
 */
export function coverSrc(
  owner: CoverOwner,
  slug: string,
  coverImage?: string | null,
): string {
  const proxied = `/api/cover/${owner}/${encodeURIComponent(slug)}`;
  const value = coverImage?.trim();
  if (!value) return proxied;
  if (value.startsWith("data:")) return proxied;
  return value;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx jest src/lib/__tests__/images.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Confirm no caller depended on the old `null` return**

Run: `npx tsc --noEmit`
Expected: no new errors. `absoluteCoverUrl` in the same file guards with `src ? ... : null`, which stays valid against a non-null `string`.

- [ ] **Step 6: Measure the drop locally**

With `npm run dev` running:

```bash
curl -s "http://localhost:3000/archive" | wc -c
curl -s "http://localhost:3000/archive" | grep -c "data:image" || true
```

Expected: byte count falls from ~3,028,381 to under 200,000, and the `data:image` count is `0`.

- [ ] **Step 7: Commit**

```bash
git add src/lib/images.ts src/lib/__tests__/images.test.ts
git commit -m "fix(cover): serve covers via /api/cover instead of inlining base64 data URIs"
```

---

### Task 3: Stop pulling blob columns out of Postgres

Task 2 stops the blob reaching the browser; it still travels Supabase → serverless function on every render. Measured: `getRecentPieces({take:20})` returns a **2,842 KB** payload with `coverImage` selected versus **4 KB** without it, and `getFeaturedSeries(3)` returns **6,119 KB** because `include` pulls the whole `Series` row (one cover is 3.1 MB). Together that is ~9 MB per home-page render, which is why the `withTimeout(..., [], 5000)` / `2500` guards fire and the page renders empty.

Cards never need the stored value — they need a URL, and `coverSrc` can build one from `slug` alone.

**Files:**
- Modify: `src/lib/pieces.ts` — `withCover`, `cardSelect`, `CardPiece`, `withSeriesCovers`, `getSeriesList`, `getFeaturedSeries`, `getSeriesBySlug`

**Interfaces:**
- Consumes: `coverSrc(owner, slug, coverImage?)` from Task 2, returning a non-null `string`.
- Produces: `cardSelect` **without** `coverImage` but **with** `coverImageWidth` / `coverImageHeight`; `CardPiece` gains a non-null `coverImage: string` supplied by `withCover`. Components already read `piece.coverImage`, `piece.coverImageWidth`, `piece.coverImageHeight` (see `article-card.tsx:86-89`, `piece-card.tsx:116-119`), so this makes those reads work rather than resolving to `undefined`.

**Field audit (already done — `seriesSelect` below is complete).** The `Series` model has exactly `id, slug, titleBn, titleEn, descBn, coverImage, coverImageWidth, coverImageHeight, createdAt, updatedAt, pieces`. Across all three consumers — `src/app/page.tsx` (via `getFeaturedSeries`), `src/app/series/page.tsx` and `src/app/series/[slug]/page.tsx` (via `getSeriesList` / `getSeriesBySlug`), plus `featured-series.tsx`'s `SeriesWithPieces` type and `seriesJsonLd` in `src/lib/seo.tsx:156` — the only fields read are `id`, `slug`, `titleBn`, `titleEn`, `descBn`, `coverImage`, and `pieces`. `coverImage` is supplied by `withCover`, not by the select. Nothing reads `createdAt` or `updatedAt` off these queries (`sitemap.ts:73-78` looks like a counterexample but runs its own `prisma.series.findMany`).

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/card-select.test.ts`:

```ts
import { describe, it, expect } from "@jest/globals";
import { cardSelect } from "@/lib/pieces";

describe("cardSelect", () => {
  it("never selects the coverImage blob column", () => {
    expect("coverImage" in cardSelect).toBe(false);
  });

  it("selects the cheap dimension columns so cards can size images", () => {
    expect(cardSelect).toMatchObject({
      coverImageWidth: true,
      coverImageHeight: true,
    });
  });

  it("still selects the fields cards render", () => {
    for (const field of [
      "slug",
      "kind",
      "titleBn",
      "dekBn",
      "excerptBn",
      "readingMinutes",
      "featured",
      "publishedAt",
      "audioUrl",
      "seriesOrder",
    ]) {
      expect(cardSelect).toHaveProperty(field, true);
    }
  });

  it("does not select the bodyBn blob either", () => {
    expect("bodyBn" in cardSelect).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx jest src/lib/__tests__/card-select.test.ts`
Expected: FAIL — `coverImage` is present, `coverImageWidth` is absent.

- [ ] **Step 3: Rewrite `cardSelect` and `withCover`**

In `src/lib/pieces.ts`, replace `withCover`, `cardSelect`, and the `CardPiece` type with:

```ts
/**
 * `coverImage` is deliberately NOT selected.
 *
 * Legacy rows hold the entire image as a base64 data URI (up to 3.1 MB), so
 * selecting it turned a 4 KB list query into a 2.8 MB transfer and blew the
 * home page's query timeouts. `withCover` reconstructs a URL from the slug
 * instead. The two dimension columns are plain ints and stay, so cards can
 * reserve space and avoid layout shift.
 */
export const cardSelect = {
  slug: true,
  kind: true,
  titleBn: true,
  dekBn: true,
  excerptBn: true,
  coverImageWidth: true,
  coverImageHeight: true,
  readingMinutes: true,
  featured: true,
  publishedAt: true,
  audioUrl: true,
  seriesOrder: true,
  authors: { select: { slug: true, nameBn: true } },
} satisfies Prisma.PieceSelect;

export type CardPiece = Prisma.PieceGetPayload<{ select: typeof cardSelect }> & {
  coverImage: string;
};

function withCover<T extends { slug: string; coverImage?: string | null }>(
  row: T,
  owner: "piece" | "series" = "piece",
): T & { coverImage: string } {
  return { ...row, coverImage: coverSrc(owner, row.slug, row.coverImage) };
}
```

- [ ] **Step 4: Stop `include` from dragging the 3.1 MB series cover**

Still in `src/lib/pieces.ts`, add an explicit series select above `withSeriesCovers`:

```ts
/** Same reasoning as `cardSelect`: never select `Series.coverImage`. */
const seriesSelect = {
  id: true,
  slug: true,
  titleBn: true,
  titleEn: true,
  descBn: true,
  coverImageWidth: true,
  coverImageHeight: true,
} satisfies Prisma.SeriesSelect;
```

Relax the `withSeriesCovers` constraint so it no longer requires the column:

```ts
function withSeriesCovers<
  T extends {
    slug: string;
    coverImage?: string | null;
    pieces: { slug: string; coverImage?: string | null }[];
  },
>(series: T) {
  return {
    ...withCover(series, "series"),
    pieces: series.pieces.map((row) => withCover(row)),
  };
}
```

Then convert all three series queries from `include` to `select`. `getSeriesList`:

```ts
export const getSeriesList = cache(async () => {
  const rows = await prisma.series.findMany({
    select: {
      ...seriesSelect,
      pieces: {
        where: PUBLISHED,
        select: cardSelect,
        orderBy: { seriesOrder: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
  return rows.filter((s) => s.pieces.length > 0).map(withSeriesCovers);
});
```

`getFeaturedSeries`:

```ts
export const getFeaturedSeries = cache(async (take = 3) => {
  const rows = await prisma.series.findMany({
    select: {
      ...seriesSelect,
      pieces: {
        where: PUBLISHED,
        select: cardSelect,
        orderBy: { seriesOrder: "asc" },
      },
    },
    take: take * 3,
  });

  const sorted = rows
    .filter((s) => s.pieces.length > 0)
    .map(withSeriesCovers)
    .sort((a, b) => {
      const aLatest = a.pieces[a.pieces.length - 1]?.publishedAt;
      const bLatest = b.pieces[b.pieces.length - 1]?.publishedAt;
      if (!aLatest) return 1;
      if (!bLatest) return -1;
      return new Date(bLatest).getTime() - new Date(aLatest).getTime();
    });

  return sorted.slice(0, take);
});
```

`getSeriesBySlug`:

```ts
export const getSeriesBySlug = cache(async (slug: string) => {
  const series = await prisma.series.findUnique({
    where: { slug },
    select: {
      ...seriesSelect,
      pieces: {
        where: PUBLISHED,
        select: cardSelect,
        orderBy: [{ seriesOrder: "asc" }, { publishedAt: "asc" }],
      },
    },
  });
  return series && withSeriesCovers(series);
});
```

- [ ] **Step 5: Keep the single-article query as-is**

`getPieceBySlug` must keep its `include` — the reader page needs `bodyBn`, `sources`, `timeline`, `tags`. It is one row, and after Task 6 its `coverImage` is a short URL. Do not change it.

- [ ] **Step 6: Run the tests and typecheck**

Run: `npx jest src/lib/__tests__/ && npx tsc --noEmit`
Expected: all tests PASS. `tsc` may flag `featured-series.tsx`'s local `SeriesWithPieces` type, which declares `coverImage: string | null`; a non-null `string` is assignable to it, so no change is needed there. Fix any genuine errors by widening local types, never by re-adding `coverImage` to a select.

- [ ] **Step 7: Verify the query payload collapsed**

Create `scripts/_verify-query-size.ts`:

```ts
import dotenv from "dotenv";
dotenv.config();
import { prisma } from "../src/lib/prisma";
import { getRecentPieces, getFeaturedSeries, getFilterFacets } from "../src/lib/pieces";

async function measure(label: string, fn: () => Promise<unknown>) {
  const start = Date.now();
  const result = await fn();
  const kb = (JSON.stringify(result).length / 1024).toFixed(0);
  console.log(`${label.padEnd(28)} ${String(Date.now() - start).padStart(5)}ms  ${kb}KB`);
}

(async () => {
  await measure("getRecentPieces take:20", () => getRecentPieces({ take: 20 }));
  await measure("getFeaturedSeries(3)", () => getFeaturedSeries(3));
  await measure("getFilterFacets", () => getFilterFacets());
  await prisma.$disconnect();
})();
```

Run: `npx tsx scripts/_verify-query-size.ts`
Expected: `getRecentPieces take:20` under **20 KB** (was 2,842 KB) and `getFeaturedSeries(3)` under **20 KB** (was 6,119 KB).

Then delete the scratch script: `rm scripts/_verify-query-size.ts`

- [ ] **Step 8: Commit**

```bash
git add src/lib/pieces.ts src/lib/__tests__/card-select.test.ts
git commit -m "perf(query): stop selecting cover blob columns in list and series queries"
```

---

### Task 4: RSS feed stops emitting data URIs

`src/app/rss.xml/route.ts:54` selects `coverImage` with a raw Prisma call and line 89-90 wraps it in `absoluteUrl(...)`, producing an `<enclosure url="http://site/data:image/webp;base64,...">` — a multi-hundred-KB broken URL per item. It also hardcodes `type="image/jpeg"` for what are actually WebP and PNG files.

**Files:**
- Modify: `src/app/rss.xml/route.ts:54, 89-90`

**Interfaces:**
- Consumes: `absoluteCoverUrl(owner, slug, coverImage)` and `coverMime(coverImage)` from `@/lib/images` (both already exported).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Reproduce the bug**

Run `npm run dev`, then:

```bash
curl -s "http://localhost:3000/rss.xml" | grep -c "data:image" || true
```

Expected before the fix: a non-zero count.

- [ ] **Step 2: Keep selecting the column but stop trusting it**

The feed needs the stored value only to derive a mime type, and `absoluteCoverUrl` routes data URIs through `/api/cover`. Leave the `coverImage: true` select in place (RSS is one small request, not a hot path) and replace the enclosure line at 89-90 with:

```ts
        piece.coverImage
          ? `      <enclosure url="${esc(
              absoluteCoverUrl("piece", piece.slug, piece.coverImage) ?? "",
            )}" type="${esc(coverMime(piece.coverImage))}" />`
```

- [ ] **Step 3: Add the imports**

At the top of `src/app/rss.xml/route.ts`, add:

```ts
import { absoluteCoverUrl, coverMime } from "@/lib/images";
```

Keep the existing `absoluteUrl` import — other lines in the file still use it.

- [ ] **Step 4: Verify**

```bash
curl -s "http://localhost:3000/rss.xml" | grep -c "data:image" || true
curl -s "http://localhost:3000/rss.xml" | grep -o '<enclosure[^>]*>' | head -3
```

Expected: `0` data URIs; enclosures point at absolute `/api/cover/piece/...` URLs with a correct `type`.

- [ ] **Step 5: Commit**

```bash
git add src/app/rss.xml/route.ts
git commit -m "fix(rss): emit absolute cover urls with correct mime instead of data uris"
```

---

### Task 5: Upload route fails loudly instead of persisting a blob

`src/app/api/admin/upload/route.ts` returns `url: dataUri` in two places — when Cloudinary throws (line ~88) and when credentials are absent (line ~97). That return value is written straight into `coverImage`, which is how all 17 bad rows were created. An admin uploading an image sees "success" and silently poisons the database.

**Files:**
- Modify: `src/app/api/admin/upload/route.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: on failure the route now returns `{ ok: false, error: string }` with status `502` (Cloudinary failed) or `503` (not configured). `src/components/admin/image-upload.tsx` already treats a non-`ok` body as an error, so no client change is needed.

- [ ] **Step 1: Replace the credentials-missing fallback**

Replace the final fallback block (the one returning `ok: true, url: dataUri, size: file.size`) with:

```ts
    // No silent data-URI fallback: a data URI written into `coverImage` inlines
    // the whole image into every HTML and RSC payload and cannot be optimized
    // or cached. Failing here is better than poisoning the database.
    return NextResponse.json(
      {
        ok: false,
        error:
          "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET before uploading images.",
      },
      { status: 503 },
    );
```

- [ ] **Step 2: Replace the Cloudinary-threw fallback**

Replace the `catch (cloudinaryErr: unknown)` block's response with:

```ts
      } catch (cloudinaryErr: unknown) {
        const errMsg =
          cloudinaryErr instanceof Error ? cloudinaryErr.message : String(cloudinaryErr);
        console.error("Cloudinary upload failed:", errMsg);

        return NextResponse.json(
          { ok: false, error: `Cloudinary upload failed: ${errMsg}` },
          { status: 502 },
        );
      }
```

- [ ] **Step 3: Confirm the data URI locals are still needed**

Do **not** delete the `base64` / `dataUri` locals — `cloudinary.uploader.upload(dataUri, ...)` consumes `dataUri`, so it is still load-bearing on the success path. Only the two *fallback returns* that leaked it into the response are being removed. Confirm nothing else broke:

Run: `npx tsc --noEmit`
Expected: no unused-variable errors.

- [ ] **Step 4: Verify the guard fires**

```bash
CLOUDINARY_CLOUD_NAME= CLOUDINARY_API_KEY= CLOUDINARY_API_SECRET= npm run dev
```

In another shell, confirm the route rejects rather than returning a data URI (the admin guard returns 401 first, which is fine — the point is that no `data:` ever appears in a success body):

```bash
curl -s -X POST "http://localhost:3000/api/admin/upload" -o - -w "\n%{http_code}\n" | grep -c "data:image" || true
```

Expected: `0`.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/upload/route.ts
git commit -m "fix(upload): reject uploads when cloudinary fails instead of storing a data uri"
```

---

### Task 6: Migrate the stored covers to Cloudinary

`scripts/migrate-to-cloudinary.ts` already exists and is broadly correct, but it was evidently never completed — all 13 published piece covers and 3 of 4 series covers are still data URIs, most likely re-imported later by `scripts/import-backup-to-supabase.ts`. The script's `prisma.piece.findMany` has no `where` clause, so it also processes drafts; expect the dry-run count to be **at least** 13 pieces + 3 series and treat any extra rows as legitimately in scope. Three gaps must be closed before running it: it never writes `coverImageWidth`/`coverImageHeight` (all rows are `null`), it never verifies the uploaded URL is reachable before overwriting the only copy of the image, and it has no dry run.

**Files:**
- Modify: `scripts/migrate-to-cloudinary.ts`
- Modify: `package.json` (scripts section)

**Interfaces:**
- Consumes: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` from `.env` (all confirmed present).
- Produces: `coverImage` columns holding `https://res.cloudinary.com/...` URLs, plus populated `coverImageWidth`/`coverImageHeight`.

- [ ] **Step 1: Return dimensions from the uploader**

In `scripts/migrate-to-cloudinary.ts`, change `uploadToCloudinary` to return the full shape:

```ts
type Uploaded = { url: string; width: number; height: number };

async function uploadToCloudinary(input: string, publicId: string): Promise<Uploaded | null> {
  try {
    console.log(`  📤 Uploading to Cloudinary (${publicId})...`);
    const result = await cloudinary.uploader.upload(input, {
      folder: "thoughts-whatever",
      public_id: publicId,
      overwrite: true,
      transformation: [
        { width: 1600, crop: "limit" },
        { quality: "auto:good" },
        { fetch_format: "auto" },
      ],
    });
    return { url: result.secure_url, width: result.width, height: result.height };
  } catch (err: any) {
    console.error(`  ❌ Failed uploading ${publicId}:`, err?.message || err);
    return null;
  }
}
```

- [ ] **Step 2: Add a verification helper**

Add below `uploadToCloudinary`:

```ts
/** Never overwrite the only copy of an image with a URL that does not resolve. */
async function verify(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "GET" });
    const type = res.headers.get("content-type") ?? "";
    const ok = res.ok && type.startsWith("image/");
    if (!ok) console.error(`  ❌ Verification failed: ${res.status} ${type}`);
    return ok;
  } catch (err: any) {
    console.error(`  ❌ Verification threw:`, err?.message || err);
    return false;
  }
}
```

- [ ] **Step 3: Add a dry-run flag**

Directly after the `cloudinary.config({...})` call, add:

```ts
const DRY_RUN = process.argv.includes("--dry-run");
if (DRY_RUN) console.log("🧪 DRY RUN — no database writes\n");
```

- [ ] **Step 4: Gate and enrich both write sites**

Replace the piece write block with:

```ts
    const uploaded = await uploadToCloudinary(sourceInput, publicId);
    if (!uploaded) continue;
    if (!(await verify(uploaded.url))) continue;

    if (DRY_RUN) {
      console.log(`  🧪 would set ${uploaded.url} (${uploaded.width}x${uploaded.height})`);
      continue;
    }

    await prisma.piece.update({
      where: { id: piece.id },
      data: {
        coverImage: uploaded.url,
        coverImageWidth: uploaded.width,
        coverImageHeight: uploaded.height,
      },
    });
    console.log(`  ✨ ${uploaded.url} (${uploaded.width}x${uploaded.height})`);
```

Replace the series write block with:

```ts
      const uploaded = await uploadToCloudinary(s.coverImage, publicId);
      if (!uploaded) continue;
      if (!(await verify(uploaded.url))) continue;

      if (DRY_RUN) {
        console.log(`  🧪 would set ${uploaded.url} (${uploaded.width}x${uploaded.height})`);
        continue;
      }

      await prisma.series.update({
        where: { id: s.id },
        data: {
          coverImage: uploaded.url,
          coverImageWidth: uploaded.width,
          coverImageHeight: uploaded.height,
        },
      });
      console.log(`  ✨ ${uploaded.url} (${uploaded.width}x${uploaded.height})`);
```

- [ ] **Step 5: Disconnect cleanly**

Replace the trailing `process.exit(0)` in `run()` with nothing, and replace the bare `run();` call at the bottom with:

```ts
run()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 6: Register the npm script**

Add to the `scripts` block in `package.json`:

```json
    "migrate:covers": "tsx scripts/migrate-to-cloudinary.ts",
```

- [ ] **Step 7: Back up before touching data**

```bash
npx tsx scripts/export-full-db.ts
```

Confirm a fresh file appears under `backups/`. **Do not proceed without it** — the data URIs are the only copy of some of these images.

- [ ] **Step 8: Dry run**

```bash
npm run migrate:covers -- --dry-run
```

Expected: `✅ Cloudinary Connection Verified!`, then a `🧪 would set https://res.cloudinary.com/...` line for each data-URI row (at least the 13 published pieces and 3 series). Zero `❌` lines. If any piece reports `⚠️ No local file or Data URI found`, stop and investigate before the real run.

- [ ] **Step 9: Real run**

```bash
npm run migrate:covers
```

- [ ] **Step 10: Confirm no data URIs remain**

Create `scripts/_audit-covers.ts`:

```ts
import dotenv from "dotenv";
dotenv.config();
import { prisma } from "../src/lib/prisma";

(async () => {
  const pieces = await prisma.piece.findMany({
    select: { slug: true, coverImage: true, coverImageWidth: true, coverImageHeight: true },
  });
  const series = await prisma.series.findMany({ select: { slug: true, coverImage: true } });
  const bad = [...pieces, ...series].filter((r) => (r.coverImage ?? "").startsWith("data:"));
  const noDims = pieces.filter((p) => !p.coverImageWidth || !p.coverImageHeight);
  console.log(`data-uri rows remaining: ${bad.length}`);
  for (const r of bad) console.log("  ", r.slug);
  console.log(`pieces missing dimensions: ${noDims.length}`);
  for (const r of noDims) console.log("  ", r.slug);
  await prisma.$disconnect();
})();
```

Run: `npx tsx scripts/_audit-covers.ts`
Expected: `data-uri rows remaining: 0`. Keep the reported `pieces missing dimensions` count — Task 7 clears it. Then `rm scripts/_audit-covers.ts`.

- [ ] **Step 11: Commit**

```bash
git add scripts/migrate-to-cloudinary.ts package.json
git commit -m "chore(covers): harden cloudinary migration with dry-run, verification, and dimensions"
```

---

### Task 7: Backfill any remaining image dimensions with sharp

`scripts/backfill-image-dimensions.ts` currently `require("image-size")`, a package that is **not in `package.json`**. The require throws, the surrounding `try` swallows it, and the script reports "could not determine dimensions" for every row — which is why all 13 rows are `null`. It also only handles `http(s)` URLs, so it could never have read a data URI. `sharp` is already a devDependency and handles both.

Only run this if Task 6 Step 10 reported a non-zero `pieces missing dimensions` count.

**Files:**
- Modify: `scripts/backfill-image-dimensions.ts`

**Interfaces:**
- Consumes: `sharp` (devDependency, already installed).
- Produces: populated `coverImageWidth` / `coverImageHeight` on `Piece`.

- [ ] **Step 1: Replace the probe with a sharp-based one**

Replace the `https`/`http`/`image-size` imports and the whole `probeImageSize` function with:

```ts
import sharp from "sharp";

/** Handles both a remote URL and a legacy base64 data URI. */
async function probeImageSize(src: string): Promise<{ width: number; height: number } | null> {
  try {
    let buffer: Buffer;

    if (src.startsWith("data:")) {
      const base64 = src.slice(src.indexOf(",") + 1);
      buffer = Buffer.from(base64, "base64");
    } else if (/^https?:\/\//i.test(src)) {
      const res = await fetch(src);
      if (!res.ok) return null;
      buffer = Buffer.from(await res.arrayBuffer());
    } else {
      return null;
    }

    const { width, height } = await sharp(buffer).metadata();
    return width && height ? { width, height } : null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Register the npm script**

Add to `package.json` scripts:

```json
    "backfill:dimensions": "tsx scripts/backfill-image-dimensions.ts",
```

- [ ] **Step 3: Run it**

```bash
npm run backfill:dimensions
```

Expected: a `✓ Updated "<slug>": <w>x<h>` line per row, and a final `Updated N/N pieces` with no `⚠` lines.

- [ ] **Step 4: Commit**

```bash
git add scripts/backfill-image-dimensions.ts package.json
git commit -m "fix(scripts): probe image dimensions with sharp instead of a missing dependency"
```

---

### Task 8: Surface query failures and stop over-prefetching

Two cleanups that only make sense once payloads are small.

`src/app/page.tsx:39-46` wraps every query in `withTimeout(..., fallback, ms)` and `Promise.allSettled`, so a failing query renders an empty section with no signal anywhere. That is why a 9 MB query bug looked like a design choice for weeks. And `src/app/archive/page.tsx` renders ~30 filter `Chip`s, each a `<Link>` to a distinct `?tag=` / `?author=` / `?year=` URL, all prefetched by default.

**Files:**
- Modify: `src/app/page.tsx:38-46`
- Modify: `src/app/archive/page.tsx` (the `Chip` component's `<Link>`)

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Log degradation on the home page**

In `src/app/page.tsx`, immediately after the three `const recentPieces` / `series` / `facets` assignments, add:

```ts
  // A silent empty fallback once hid a 9 MB query for weeks. If a section
  // degrades, say so in the server log.
  for (const [name, res] of [
    ["getRecentPieces", recentRes],
    ["getFeaturedSeries", seriesRes],
    ["getFilterFacets", facetsRes],
  ] as const) {
    if (res.status === "rejected") {
      console.error(`[home] ${name} rejected:`, res.reason);
    }
  }
  if (recentPieces.length === 0) {
    console.error("[home] rendering with zero pieces — query timed out or returned empty");
  }
```

- [ ] **Step 2: Stop prefetching every filter permutation**

In `src/app/archive/page.tsx`, in the `Chip` component, add `prefetch={false}` to the `<Link>`:

```tsx
    <Link
      href={href}
      scroll={false}
      prefetch={false}
      aria-pressed={active}
```

Leave every other `<Link>` in the codebase alone. Article and nav links are worth prefetching now that a payload is kilobytes, not megabytes.

- [ ] **Step 3: Verify the home page renders content**

With `npm run dev`:

```bash
curl -s "http://localhost:3000/" | grep -o 'href="/writing/' | wc -l
```

Expected: greater than `0` (production currently returns `0`). Check the dev server log shows no `[home]` errors.

- [ ] **Step 4: Verify the archive stopped fanning out**

```bash
curl -s "http://localhost:3000/archive" | grep -c 'prefetch' || true
```

Then load `http://localhost:3000/archive` in a browser with DevTools → Network filtered to `_rsc`. Expected: a handful of prefetches, not ~30.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/app/archive/page.tsx
git commit -m "fix(home): log degraded sections; stop prefetching every archive filter"
```

---

### Task 9: Verify against production and record the numbers

**Files:**
- Modify: `docs/PERFORMANCE_MEASUREMENTS.md`

**Interfaces:**
- Consumes: a deployed build of Tasks 1-8.
- Produces: a recorded before/after table.

- [ ] **Step 1: Full local gate**

```bash
npx jest && npx tsc --noEmit && npm run build
```

Expected: tests pass, no type errors, build completes.

- [ ] **Step 2: Deploy**

Push the branch and let Vercel deploy, or `npx vercel --prod`. Wait for the deployment to report ready.

- [ ] **Step 3: Measure the deployed site**

```bash
for p in "/" "/documentary" "/archive" "/writing" "/series"; do
  printf "%-14s " "$p"
  curl -s --compressed "https://thoughts-whatever.vercel.app$p" -o /tmp/pg.html -w "wire=%{size_download} time=%{time_total} "
  printf "raw=%s b64=%s\n" "$(wc -c < /tmp/pg.html)" "$(grep -c 'data:image' /tmp/pg.html || true)"
done
```

Success criteria, all of which must hold:
- `/documentary` wire size under **150,000** bytes (was 4,175,753).
- `/archive` wire size under **150,000** bytes (was 1,984,542).
- Every route reports `b64=0`.
- `/` returns a non-zero count for `grep -o 'href="/writing/'`.

- [ ] **Step 4: Confirm the article RSC payload shrank**

```bash
curl -s -H "RSC: 1" --compressed "https://thoughts-whatever.vercel.app/writing/crime-and-punishment-3" -o /tmp/a.bin -w "rsc wire=%{size_download} time=%{time_total}\n"
grep -c "data:image" /tmp/a.bin || true
```

Expected: wire size under **60,000** bytes (was 908,919) and `0` data URIs.

- [ ] **Step 5: Confirm covers are cached, not regenerated**

```bash
curl -sI "https://thoughts-whatever.vercel.app/api/cover/piece/crime-and-punishment-3" | grep -i "http/\|location\|cache-control"
```

Expected: a `307` with a `Location:` pointing at `res.cloudinary.com` and an `immutable` `Cache-Control`. (Before Task 6 it would be a `200` serving bytes — also correct, just slower.)

- [ ] **Step 6: Record the results**

Append this section to `docs/PERFORMANCE_MEASUREMENTS.md`, replacing each `<...>` with the number measured in Steps 3-4:

```markdown
## 2026-08-15 — Cover image payload fix

Cover images were stored in Postgres as base64 data URIs (133 KB – 3.1 MB per
row) and `coverSrc` returned them verbatim, so each blob was inlined into every
HTML and RSC payload — uncacheable, unoptimizable, and re-sent on every request.
List queries also selected the column, pulling ~9 MB out of Supabase per home
render, which blew the `withTimeout` guards and made the home page render empty.
The fix routes every cover through the existing `/api/cover/{owner}/{slug}`
endpoint, drops the blob columns from list and series selects, and migrates the
stored images to Cloudinary.

| Route | Before (wire) | After (wire) | Before b64 | After b64 |
|---|---|---|---|---|
| `/` | 9,577 (empty page) | <after> | 0 | 0 |
| `/documentary` | 4,175,753 | <after> | 9,036,724 | 0 |
| `/archive` | 1,984,542 | <after> | 2,905,647 | 0 |
| `/writing/crime-and-punishment-3` (RSC) | 908,919 | <after> | 2,332,309 | 0 |

| Query | Before | After |
|---|---|---|
| `getRecentPieces({take:20})` | 670 ms / 2,842 KB | <after> |
| `getFeaturedSeries(3)` | 767 ms / 6,119 KB | <after> |
| `getFilterFacets()` | 505 ms / 3 KB | <after> |

Home page article links: 0 before, <after> after.
Article RSC fetch time on a Vercel cache HIT: 9.93 s before, <after> after.
```

The three query "after" numbers come from the run you already did in Task 3 Step 7 — reuse them rather than re-running the deleted scratch script.


- [ ] **Step 7: Commit**

```bash
git add docs/PERFORMANCE_MEASUREMENTS.md
git commit -m "docs(perf): record cover-image payload fix measurements"
```

---

## Rollback

- **Tasks 1-5, 8** are code-only. `git revert` the relevant commit.
- **Tasks 6-7** change data. Restore from the backup taken in Task 6 Step 7 with `npx tsx scripts/restore-backup.ts`. Note that Tasks 1-3 keep working correctly against un-migrated data URI rows, so a data rollback does **not** require a code rollback.

## Out of Scope

- Replacing Cloudinary with another CDN or with Vercel Blob storage.
- Adding a separate backend service. The measured bottleneck is payload size, not request count or API topology; a separate backend would add a hop without removing a byte.
- The admin editor pages (`src/app/admin/(dashboard)/pieces/[id]/page.tsx:48`, `taxonomy/page.tsx:80`) still read the raw `coverImage` value, which is correct — the editor needs to display and edit the stored value. After Task 6 that value is a short URL anyway.
- **The home page's pull-quote section is already dead, and Task 3 does not change that.** `src/app/page.tsx:73` reads `(p as any).bodyBn` off `recentPieces`, but `bodyBn` has never been in `cardSelect`, so `extractPullQuotes` always receives empty strings and `<Quote>` never renders. `getPullQuoteCandidates` in `src/lib/pieces.ts:309` exists for exactly this and is unused. Wiring it up is a separate fix — do **not** add `bodyBn` to `cardSelect` to solve it, which would reintroduce the problem this plan removes. The `as any` cast means `tsc` will not flag it either way.
