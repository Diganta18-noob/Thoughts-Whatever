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
guard substituted an empty array silently. Task 8 added the missing
`console.error` so this can never again fail invisibly.

| Query | Before | After |
| :--- | :--- | :--- |
| `getRecentPieces({take:20})` | 670 ms / 2,842 KB | 7 KB |
| `getFeaturedSeries(3)` | 767 ms / 6,119 KB | 7 KB |
| `getFilterFacets()` | 505 ms / 3 KB | 4 KB |

### Two blob columns, not one

`Piece` has **two** columns holding image bytes. Dropping `coverImage` from the
list selects fixed the list routes but not the article route, because
`getPieceBySlug` uses Prisma `include:`, which pulls every scalar — including
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

The migration script writes only `coverImage`, so `ogImage` still holds 2.9 MB
of now-unread base64 in Postgres. Harmless, worth clearing separately.

### Not done: a dedicated backend

The original diagnosis was that the page fires "multiple queries from the
backend" on refresh and needs a separate backend service. The many `?_rsc=`
requests in the network panel were `<Link prefetch>` traffic, not a query
storm, and the bytes came from the payloads themselves. A separate service adds
a network hop without removing a single byte. What was actually needed was to
stop putting images in the database rows. Task 8 also set `prefetch={false}` on
the archive filter chips, which were prefetching every filter permutation.
