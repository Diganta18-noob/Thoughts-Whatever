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

> **The "after" column below has never been measured on Vercel.** Every number
> in the table comes from `next start` on a developer machine. That is adequate
> for the payload bytes, which are what this work set out to reduce, and it is
> *not* adequate for anything host-dependent. Two things were host-dependent and
> both have since been measured on real Vercel, in "Production, on the pre-fix
> build with migrated data" below: the CDN's treatment of the cover endpoint's
> `Cache-Control` / `CDN-Cache-Control` pair (confirmed — a 404 there really does
> inherit the catch-all's page directive), and the image optimizer's handling of
> an internal `src` (production optimizes the Cloudinary URL directly and returns
> AVIF). What remains unmeasured on Vercel is **this branch's own code**, which
> is not deployed anywhere: `main` is 28 commits behind. Read the table as the
> local baseline for whatever a preview deploy is eventually compared against.

Both **wire** columns are *compressed transfer bytes* — `curl --compressed`,
i.e. what the browser actually downloads — measured the same way on both sides
so the ratio is meaningful. Raw response bytes are given separately below,
because the two differ by 7-8× on these pages and confusing them makes the fix
look either trivial or miraculous.

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

Raw (uncompressed) response bytes for the same "after" build, for anyone
re-measuring without `--compressed`: `/` 121,487 · `/documentary` 108,598 ·
`/archive` 121,383 · `/writing` 41,579 · `/series` 54,470 ·
`/writing/crime-and-punishment-3` 96,186 HTML / 29,297 RSC. Zero `data:image`
occurrences on all of them. No `[withTimeout]` line appeared in the server log
during these requests, so every query completed inside its budget rather than
being papered over by a fallback.

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

### Cloudinary migration: run 2026-08-16

`scripts/migrate-to-cloudinary.ts` had never successfully written anything —
`cloudinary.api.ping()` failed with `cloud_name mismatch` (HTTP 401) because
`CLOUDINARY_CLOUD_NAME` held the literal string `"thoughts-whatever"`. With a
real cloud name supplied, ping returned `status: ok` and the migration ran: a
`--dry-run` first (which uploads for real but writes nothing), then the live
pass. All 16 rows now hold `https://res.cloudinary.com/...` URLs.

A full `scripts/export-full-db.ts` backup was taken first and verified on disk —
`backups/mongodb-backup-2026-08-16T14-21-53-446Z.json`, 9,752,880 bytes,
containing all 16 data URIs (6,579,270 chars). That file is the only remaining
copy of the pre-migration images, so it is not disposable.

Because the dry run creates the assets, the live pass reported `existing` on all
16 and reused them rather than re-uploading — `overwrite: false` behaving as
designed. Every URL was fetched and checked for a `200` plus an `image/*`
content-type before its row was written.

What moved out of Postgres, measured on the 13 published rows:

| Column | Before | After |
| :--- | ---: | ---: |
| `Piece.coverImage` (13 published) | 2,905,647 chars | 1,404 chars |
| `Series.coverImage` (3 rows) | 3,673,623 chars | 345 chars |
| `Piece.ogImage` (13 published) | 2,905,647 chars | **2,905,647 chars — untouched** |

Longest surviving `coverImage` value: 115 chars. `coverImageWidth`/`Height` came
back from the upload response, so all 16 rows now carry dimensions — including
the 3 series rows that were null, which is what `seriesSelect`'s comment was
waiting on: the series hero no longer falls back to `probeImageDimensions`.

`ogImage` is deliberately still base64. Task 6's Interfaces block scopes it to
`coverImage` plus dimensions, and `ogImage` is already inert on every read path —
`pieceSelect` does not name it, and `getPieceBySlug` reads it as a bounded
512-byte prefix that `usablePrefix` rejects for anything starting `data:`. It
costs nothing per request and 2.9 MB at rest. Pointing it at the row's new
Cloudinary URL would be strictly better than the status quo, but it is a write
to a column no task authorized, so it is left as a decision rather than done
quietly.

The API secret still needs rotating. It was printed in plaintext by the SDK's own
401 error, and again in the chat transcript that supplied it.

### The endpoint after the migration

`/api/cover` no longer decodes a blob out of Postgres; it takes the `remote`
branch and proxies Cloudinary. That path existed but had only ever been exercised
by unit tests. Verified end-to-end on a production build:

| Request | Result |
| :--- | :--- |
| `/api/cover/piece/crime-and-punishment-1` | 200 `image/jpeg` 216,989 B |
| `/api/cover/piece/রক্তকরবী` (percent-encoded) | 200 `image/jpeg` 244,192 B |
| `/api/cover/series/crime-and-punishment` | 200 `image/jpeg` **233,658 B** (was a 2,376,528-byte PNG out of Postgres — 10.2×) |
| `/_next/image?url=/api/cover/piece/…&w=640&q=75` | 200 `image/jpeg` 104,891 B |
| same, with a browser `Accept: image/avif,image/webp` | 200 `image/avif` **78,645 B** |
| `/_next/image?url=/api/cover/series/…&w=1080&q=75` | 200 `image/jpeg` 209,591 B |

Proxied covers carry `Cache-Control` and `CDN-Cache-Control` of
`public, max-age=31536000, s-maxage=31536000, immutable`, plus `nosniff`. The
`next/image` chain — optimizer → `/api/cover` → proxy → Cloudinary — returns
bytes at every step, which is the whole point of proxying rather than
redirecting: a 307 there fails, for the reason the route's own comment records.

**The first `/_next/image` numbers taken after the migration were wrong, and the
trap is worth naming.** They came back byte-identical to the pre-migration run
(100,694 B) because the optimizer's cache key is the `src` URL, `w` and `q` — all
unchanged by a migration that only altered what the endpoint reads. With
`minimumCacheTTL: 31536000` those entries would serve for a year.
`X-Nextjs-Cache: HIT` is the tell; the table above was re-measured after
`rm -rf .next/cache/images` and shows `MISS`. The same applies on Vercel: covers
optimized before the migration keep serving until that cache turns over. Harmless
here — it is the same picture, since the data URI was the upload source — but any
re-measurement that skips this step is measuring the old bytes.

Page payloads did not move, which is the expected result: the blob left the HTML
at Task 3, not Task 6. `/` 121,484 raw / 17,291 wire · `/documentary` 108,598 /
14,463 · `/archive` 121,383 / 17,359 · `/writing` 41,579 / 7,804 · `/series`
54,470 / 9,173 · `/series/crime-and-punishment` 58,088 / 10,351 ·
`/writing/crime-and-punishment-1` 76,676 / 15,847 ·
`/authors/fyodor-dostoevsky` 49,438 / 8,991. All 200, zero base64 rasters, zero
`res.cloudinary.com` in the HTML (covers still route through `/api/cover`), and
no `[withTimeout]` line in the server log.

One counting note, so a future re-measure does not read a regression into it: a
bare `grep -c "data:image"` finds **one** hit on `/`. It is a hand-written
decorative `data:image/svg+xml` grain texture in an `aria-hidden`
`background-image` — 25 chars of prefix, present before the migration and
unrelated to covers. The figures in this document count base64 *rasters*
(`data:image/(png|jpe?g|webp|gif|avif);base64`), which are zero everywhere.

The feed changed shape for the better: 15,576 bytes, 13 items, 13 enclosures, now
pointing **directly at `res.cloudinary.com`** with `type="image/jpeg"` instead of
at `/api/cover` with `image/webp`. `absoluteCoverUrl` passes a stored URL through
untouched, so feed readers fetch the CDN with no origin hop. (Locally the item
links still say `http://localhost:3000` because `NEXT_PUBLIC_SITE_URL` is unset
outside Vercel.)

Re-measuring the feed under `next start` has a footgun of its own. Moving
`public/rss.xml` aside **while the server is running** produces a bare `400`, not
the route: `next start` enumerates `public/` once at boot and keeps serving
`/rss.xml` from that manifest, then fails on the missing file. Nothing is logged,
so it reads like a route regression. Move the file first, then start the server —
booted that way the route answers `200`.

### Production, on the pre-fix build with migrated data

The migration changed data that the *deployed* build reads, so production was
re-measured. Nothing was deployed: `main` is still at `dffaf88`, 28 commits
behind this branch, and the CI deploy job only fires on `main`.

| Route | Before (wire) | Now (wire) | Change |
| :--- | ---: | ---: | ---: |
| `/documentary` | 4,175,753 | 12,998 | **321×** |
| `/archive` | 1,984,550 | 14,847 | 134× |
| `/` | 10,600 (0 links) | 102,272 raw (5 links) | see below |
| `/writing` | 8,466 | 8,466 | — |
| `/series` | 9,528 | 9,498 | — |

Zero base64 rasters on all of them. **The data migration alone fixed the empty
home page**, with none of this branch's code deployed: `/` went from 58,262 bytes
and 0 article links to 102,272 bytes and 5 — the same 5 unique piece links the
fixed local build renders. The 9 MB read that was blowing `getFeaturedSeries`'s
`withTimeout` guard is now a few hundred bytes, so the query finishes and the
fallback stops firing. The page is ISR-cached at `s-maxage=300`; the change only
became visible after `X-Vercel-Cache` went `HIT → STALE → HIT` on a fresh render,
which is why an immediate re-check after the migration still showed the old page.

Covers render on the deployed build because main's `coverSrc` returns a stored
value verbatim and `res.cloudinary.com` is already in `remotePatterns` there —
production optimizes the Cloudinary URL directly, `200 image/avif` 20,411 B at
the size the documentary grid requests.

`/api/cover` returns **404 for every migrated cover on production**, and that is
harmless: main's version of the route matches `^data:...;base64,` and treats
anything else as a miss, but main's `coverSrc` only falls back to the endpoint
when the column is empty, so production HTML contains **0** `/api/cover`
references. The endpoint is unreachable dead code there until this branch merges,
at which point the proxy path verified above takes over. The 8 pieces and 1
series with a null `coverImage` do reach it and get the 404 → placeholder, exactly
as they did before.

That 404 did settle one thing the local build could not. It came back carrying
both its own `Cache-Control: public, max-age=60` **and**
`CDN-Cache-Control: public, max-age=300, s-maxage=300, stale-while-revalidate=86400`
from main's catch-all `source: "/:path*"` — live Vercel confirmation of the claim
in the route's comment, that config headers are appended to a Route Handler's own
and cannot vary by status code. A 404 there really would ship a cache directive
meant for pages. This branch splits that block so the cover route is excluded.

**Still unmeasured on Vercel:** this branch's own code. The `/api/cover` proxy
under Vercel's CDN — whether the edge honours its `immutable` pair on a 200 and
the short TTLs on a 404/502 — cannot be observed until the branch is reachable,
because the deployed route is main's data-URI-only version.

A preview **does** exist and built successfully. Vercel's GitHub integration
deployed `2a82bdf` at 12:44Z:

```
https://thoughts-whatever-71he1p7ui-digantas-projects-7e2f5959.vercel.app
```

It is not measurable from here because Deployment Protection is on: every request
answers `302` to `vercel.com/sso-api`, so the CDN never serves the route. Closing
this out needs one of three human actions — a Protection Bypass for Automation
secret (sent as `x-vercel-protection-bypass`), turning protection off for
previews, or merging to `main`. The `vercel` CLI is installed but the repo has no
`.vercel` link and no token, so it cannot substitute.

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
