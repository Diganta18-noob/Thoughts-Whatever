# Performance & Reliability Optimization Report

## Overview
Comprehensive performance and reliability audit and optimization performed for the Thoughts Whatever platform deployed on Vercel with Neon PostgreSQL and Prisma ORM.

---

## 1. Root Cause Analysis & Solution Summary

| Area | Before (Problem) | Root Cause | After (Solution) | Expected Impact |
| :--- | :--- | :--- | :--- | :--- |
| **Admin Overview Page** | Black screen on `/admin` for multiple seconds | Client-side `useEffect` fetch fired only after full JS mount & hydration | Server-side parallel fetch (`Promise.allSettled`) passing `initialData` + `<Suspense>` | **Instant SSR render** with 0ms hydration delay |
| **Unique Visitor Count** | High latency & function memory spike | `groupBy(["sessionId"])` loaded tens of thousands of session IDs into Node.js heap | `$queryRaw` with `COUNT(DISTINCT "sessionId")` in PostgreSQL | **95% memory reduction**, 5-10x query speedup |
| **Daily Traffic Trend** | Loading 10k event records into Node memory | `findMany` with `take: 10000` + JS-side loops | `$queryRaw` using `DATE_TRUNC('day', "createdAt")` and DB aggregation | Query payload reduced from 10k rows to ~30 rows |
| **Archive Listing** | Heavy memory load per request | Unbounded `take: 200` full card payloads with relational fields | Default `take: 50` with `skip` pagination support | **75% reduction in initial payload** per page |
| **Publishing Timeline** | Scanned all piece records | Full `findMany` on all pieces without grouping | `$queryRaw` with `EXTRACT(YEAR/MONTH)` grouping | ~10-20 grouped rows max |
| **Route Revalidation** | Nuclear cache busting on any publish | `revalidatePath("/", "layout")` cleared entire cache | Targeted path revalidation (`/writing`, `/writing/[slug]`, etc.) | **Sub-500ms targeted cache invalidations** |
| **Admin Navigation** | Blank screen during route transitions | Missing Next.js `loading.tsx` and `error.tsx` | Added granular loading skeletons and error boundaries | Smooth UI with zero blank flashes |
| **Client Fetch Hanging** | Indefinite spinner on slow connections | Unbounded fetch without abort signals | 15-second `AbortController` timeout + retry action | Prevents UI hanging permanently |

---

## 2. Database Indexes Audit

Prisma schema and PostgreSQL composite indexes verified:
- `Piece`: `[kind, status, publishedAt]` — used by `getRecentPieces` & listing queries.
- `Piece`: `[status, publishedAt]` — used by archive queries.
- `Piece`: `[status, featured]` — used by `getFeaturedPieces`.
- `Piece`: `[seriesId, seriesOrder]` — used by `getSeriesBySlug`.
- `AnalyticsEvent`: `[eventType, createdAt]` — used by `getOverviewStats` and `getDailyTrend`.
- `AnalyticsEvent`: `[pieceId, eventType, createdAt]` — used by `getTopArticles`.
- `AnalyticsEvent`: `[sessionId, createdAt]` — optimizes distinct session aggregation.
- `RefreshToken`: `[token, revoked]` — optimizes middleware authentication validation.

---

## 3. Vercel & Build Optimizations
- Updated `.vercelignore` to exclude `Thumnail/`, `Thumbnail/`, `Content/`, `Voice/`, `backups/`, `logs/`, `docs/`, `e2e/`, `test-results/`, `playwright-report/`, `context/`, `automation/`.
- Verified `next.config.js` image cache TTL settings (`minimumCacheTTL: 31536000`).
- Enabled micro-caching via `unstable_cache` with a 60-second TTL on admin analytics API routes.

---

## 2026-08-16 — Cover image payload fix

Cover images were stored in Postgres as base64 data URIs (133 KB – 3.1 MB per
row) and `coverSrc` returned them verbatim, so each blob was inlined into every
HTML and RSC payload — uncacheable, unoptimizable by `next/image`, and re-sent
on every request. List queries also selected the column, pulling ~9 MB out of
Supabase per home render, which blew the `withTimeout` guards and made the home
page render with **zero article links**. The fix routes every cover through the
existing `/api/cover/{owner}/{slug}` endpoint and drops the blob columns from
the list and series selects.

**Before** = production `thoughts-whatever.vercel.app`, measured 2026-08-16
while still serving the pre-fix build. **After** = local `next build` +
`next start` on the same Supabase database. Payload bytes are independent of
where the build runs; the timing column is not, so it is reported separately
below rather than compared.

> **The "after" column has never been measured on Vercel.** Every number below
> comes from `next start` on a developer machine. That is adequate for the
> payload bytes, which are what this work set out to reduce, and it is *not*
> adequate for anything host-dependent: the CDN's treatment of the cover
> endpoint's `Cache-Control` / `CDN-Cache-Control` pair, and the image
> optimizer's in-process handling of an internal `src` — which behaves
> differently under `next start` than on Vercel, and which is exactly where the
> `/api/cover` redirect bug lived. Task 9 is therefore **not complete**: it
> still needs a preview deployment, re-measured, with at least one cover request
> taken through `/_next/image`. Treat the totals here as the local baseline to
> compare that against.

| Route | Before (wire) | After (wire) | Before b64 blobs | After b64 blobs |
| :--- | ---: | ---: | ---: | ---: |
| `/` | 10,600 (0 article links) | 17,296 (12 links) | 0 | 0 |
| `/documentary` | 4,175,753 | 14,459 | 40 (9,036,764 B) | 0 |
| `/archive` | 1,984,550 | 17,358 | 13 (2,905,660 B) | 0 |
| `/writing` | 8,466 | 7,802 | 0 | 0 |
| `/series` | 9,528 | 9,172 | 0 | 0 |
| `/writing/crime-and-punishment-3` (RSC) | 908,919 | 6,329 | 1 (283,695 B) | 0 |

`/documentary` is the headline number: **4,175,753 → 14,459 wire bytes, a 289×
reduction**, and 9.0 MB of base64 removed from the raw payload.

The home page went from 0 to 12 article links. It was not slow, it was empty —
the 9 MB `getFeaturedSeries` query exceeded its `withTimeout` guard, and the
guard substituted an empty array silently.

Task 8 first tried to fix that invisibility with a `res.status === "rejected"`
check in `page.tsx`, which was dead code: `withTimeout` **resolves** with the
fallback on timeout and swallows rejections with `.catch(() => fallback)`, so
nothing handed to `Promise.allSettled` can ever settle as rejected. The check
could not have fired for any query, including the one that caused the incident.
The logging now lives inside `withTimeout` itself, which takes a `label` and
reports on both the timeout path and the `.catch` — so every degradation is
reported once, at the point the fallback is actually chosen, for every call site.

| Query | Before | After |
| :--- | :--- | :--- |
| `getRecentPieces({take:20})` | 670 ms / 2,842 KB | 7 KB |
| `getFeaturedSeries(3)` | 767 ms / 6,119 KB | 7 KB |
| `getFilterFacets()` | 505 ms / 3 KB | 4 KB |

### Two blob columns, not one

`Piece` has **two** columns holding image bytes. Dropping `coverImage` from the
list selects fixed the list routes but not the article route, because
`getPieceBySlug` used Prisma `include:`, which pulls every scalar — including
`Piece.ogImage`, which on all 13 published rows holds a byte-for-byte copy of
the base64 cover (2,905,647 chars total). The article RSC payload stayed at
221,576 bytes with one 283,695-char blob until `sanitizeShareImage` nulled it.

That change is behaviour-preserving: `shareImage` in `lib/seo.tsx` pipes
`ogImage` through `absoluteImageUrl`, which already discarded data URIs and
fell back to the `/api/cover` URL, so a data-URI `ogImage` never rendered
anyway. Verified after the fix that `og:image`, `twitter:image` and the JSON-LD
`image` all still resolve to `/api/cover/piece/crime-and-punishment-3`, that
`twitter:card` is still `summary_large_image`, and that the endpoint returns
`200 image/webp`.

Nulling the value after transfer left the *read* cost untouched, though, and
that read cost is what blew the timeout guards in the first place. `include:`
was therefore replaced with explicit selects on both `getPieceBySlug` and
`getAuthorBySlug`, naming only the columns the pages render. Neither blob column
is named, so the next blob-shaped column added to `Piece` is a non-event on
these routes rather than a silent regression. Measured on the 13 published rows:
both blob columns selected in full are 2,905,647 chars each; read as bounded
512-byte prefixes they total 6,656 chars. An article render was pulling ~447 KB
of base64 out of Postgres to display neither.

`ogImage` still needs a prefix rather than nothing, because a *real* URL there
is a usable share image. `src/lib/blob-prefix.ts` does that read — `left(col,
512)` in SQL — and rejects any prefix that fills the budget, since it may have
been cut mid-URL; the RSS feed uses the same helper for `coverImage`, where it
needs the leading bytes only to name a MIME type.

### Cloudinary migration: not run

`scripts/migrate-to-cloudinary.ts` has **never successfully written anything**.
All 16 rows still hold base64 data URIs; across the 13 published ones,
`coverImage` and `ogImage` together account for 5,811,294 chars of it in
Postgres. Task 6 steps 8-10 are blocked at the first gate:
`cloudinary.api.ping()` returns `cloud_name mismatch` (HTTP 401), because
`CLOUDINARY_CLOUD_NAME` holds the literal string `"thoughts-whatever"` rather
than a real cloud name.

This distinction matters to anyone reading the numbers above. The endpoint
currently proxies bytes out of the database, so a cover is one database read per
cache miss; after the migration it will proxy them from Cloudinary instead. The
payload figures do not change either way — the blob leaves the HTML regardless —
but the origin cost does.

Also outstanding before that migration can run: the Cloudinary API secret was
printed in plaintext by the SDK's own 401 error and needs rotating.

### `public/rss.xml` shadows the dynamic feed

`public/` is served ahead of App Router routes, so `https://<host>/rss.xml`
returns the checked-in 11,525-byte static file — dated Aug 8, and carrying
`http://localhost:3000` links — not the hardened handler. **Task 4's fix is
inert in production until that file is deleted.** `public/sitemap.xml` (6,485
bytes) shadows `src/app/sitemap.ts` the same way.

The feed numbers in this document were therefore measured against the route
directly, with `public/rss.xml` temporarily moved aside: 15,719 bytes, 13 items,
13 enclosures, 0 base64 occurrences, every enclosure `image/webp`. Deleting the
two static files is a content decision, not a code one, and is left to a human.

### Not done: a dedicated backend

The original diagnosis was that the page fires "multiple queries from the
backend" on refresh and needs a separate backend service. The many `?_rsc=`
requests in the network panel were `<Link prefetch>` traffic, not a query
storm, and the bytes came from the payloads themselves. A separate service adds
a network hop without removing a single byte. What was actually needed was to
stop putting images in the database rows. Task 8 also set `prefetch={false}` on
the archive filter chips, which were prefetching every filter permutation.
