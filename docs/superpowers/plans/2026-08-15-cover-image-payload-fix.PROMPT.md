# Master Prompt — Cover Image Payload Fix

Paste the block below into a fresh session. It is self-contained: it carries the
diagnosis, the measured evidence, the constraints, and the success criteria, so
the agent does not need to re-derive anything.

The companion plan is [`2026-08-15-cover-image-payload-fix.md`](./2026-08-15-cover-image-payload-fix.md).

---

## The prompt

````markdown
You are working in `D:\Antigravity\thoughts-whatever` — a Next.js 14 App Router
site (Bengali literary publication) on Vercel, with Prisma 6 against Supabase
Postgres through the pgbouncer pooler, Cloudinary for media, Jest for unit
tests, and tsx for scripts.

Implement the plan at `docs/superpowers/plans/2026-08-15-cover-image-payload-fix.md`,
task by task, in order. Use the superpowers:subagent-driven-development skill
(or superpowers:executing-plans) to work through it. Commit after each task.

## The problem, already diagnosed — do not re-investigate

Cover images are stored in Postgres as **base64 data URIs** in
`Piece.coverImage` and `Series.coverImage`, not as URLs. All 13 published
pieces and 3 of 4 series are affected, at 133 KB – 3.1 MB per row (one series
cover is 3,168,726 characters). Drafts are not counted in that 13, so the
migration in Task 6 may legitimately touch more rows. Article body text is
~1 KB, so the cover is roughly 250x the size of the article it belongs to.

This causes three compounding failures:

1. `coverSrc()` in `src/lib/images.ts` returns the stored value verbatim, so
   the whole blob is inlined into every HTML and RSC payload. `next/image`
   cannot optimize a `data:` URI, so `src/components/media/cover-image.tsx`
   falls back to a raw `<img src="data:...">`: no resizing, no AVIF, no CDN
   caching, no browser caching. The same 283 KB image appears 5 times in one
   payload.
2. `cardSelect` in `src/lib/pieces.ts` selects `coverImage`, and the series
   queries use Prisma `include`, which pulls the whole `Series` row. The home
   page therefore transfers ~9 MB out of Postgres per render.
3. Because of (2), the `withTimeout(..., [], 5000)` and `2500` guards in
   `src/app/page.tsx` fire, and the home page renders **completely empty** —
   zero article, series, author, or tag links in production right now. The
   silent empty-array fallbacks hide the failure entirely.

Measured baseline against `https://thoughts-whatever.vercel.app` on 2026-08-15:

| Route | wire size | raw | base64 bytes inside |
|---|---|---|---|
| `/documentary` | 4,175,753 | 9,123,718 | 9,036,724 (99%) |
| `/archive` | 1,984,542 | 3,028,381 | 2,905,647 (96%) |
| `/writing/crime-and-punishment-3` (RSC) | 908,919 | 2,360,680 | 2,332,309 (98.8%) |
| `/` | 9,577 | 49,657 | 0 — renders empty, 0 article links |

That article payload took **9.9 seconds on a Vercel cache HIT** — the CDN was
not the problem, the 909 KB download was.

Query-level measurements:

```
getRecentPieces take:20 WITH coverImage      670ms   payload=2842KB
getRecentPieces take:20 WITHOUT coverImage   312ms   payload=4KB    <- 710x smaller
getFeaturedSeries(3)                         767ms   payload=6119KB
getFilterFacets                              505ms   payload=3KB
```

Root cause of the bad data: `src/app/api/admin/upload/route.ts` silently falls
back to `return { ok: true, url: dataUri }` when Cloudinary fails or is
unconfigured, and that value is written straight into `coverImage`.

## Two things that already exist — use them, do not rebuild them

- `src/app/api/cover/[owner]/[slug]/route.ts` already decodes a stored data URI
  and serves it as real bytes with `Cache-Control: immutable, max-age=31536000`.
  Verified working in production (200, 212,754 bytes). `coverSrc` only uses it
  when `coverImage` is *empty* — the logic is inverted. Because
  `/api/cover/...` starts with `/`, `isOptimizable()` returns true for it, so
  routing covers through it gets `next/image` resizing and AVIF for free.
- `scripts/migrate-to-cloudinary.ts` already exists and is broadly correct.
  Cloudinary credentials are already present in `.env`. The script needs three
  repairs (dry-run, dimension write-back, post-upload verification), not a
  rewrite.

Also note `scripts/backfill-image-dimensions.ts` is silently a no-op: it
`require("image-size")`, which is not in `package.json`, and the throw is
swallowed by a bare `catch`. That is why all `coverImageWidth`/`Height` are
`null`. `sharp` is already a devDependency; use it.

## Hard constraints

- Do **not** add a separate backend service. The bottleneck is payload size,
  not request count. A separate backend adds a network hop without removing a
  byte. This was evaluated and rejected.
- Do **not** run `prisma migrate` or `prisma db push`. The schema is correct;
  only row values change.
- Do **not** overwrite a `coverImage` value until its Cloudinary replacement
  has been fetched and verified to return HTTP 200 with an `image/*`
  content-type. For some rows the data URI is the only copy of the image.
- Take a database backup (`npx tsx scripts/export-full-db.ts`) before the
  first task that writes data (Task 6), and confirm the file exists.
- `/api/cover/{owner}/{slug}` must never redirect to a URL whose path starts
  with `/api/cover` — that is an infinite redirect loop.
- Bengali slugs are percent-encoded in URLs. Always `decodeURIComponent` on
  read from `params` and `encodeURIComponent` on write into a URL.
- Land the code-side tasks (1-5) before the data-side tasks (6-7). The code
  fixes work correctly against both un-migrated data URIs and migrated URLs,
  so the ordering keeps every step independently revertible.
- Tests go in `src/**/__tests__/*.test.ts`, run under `jest-environment-node`
  with the `@/` -> `src/` alias, via `npx jest <path>`.
- Commit after every task; do not batch.

## Definition of done

All of these must hold against the deployed site:

- `/documentary` and `/archive` each under 150,000 bytes over the wire.
- `/writing/crime-and-punishment-3` RSC payload under 60,000 bytes.
- `grep -c 'data:image'` returns 0 for every public route and for `/rss.xml`.
- The home page returns a non-zero count for `grep -o 'href="/writing/'`.
- No `Piece.coverImage` or `Series.coverImage` value starts with `data:`.
- No `Piece` row has a null `coverImageWidth` or `coverImageHeight`.
- `npx jest && npx tsc --noEmit && npm run build` all pass.
- Before/after numbers recorded in `docs/PERFORMANCE_MEASUREMENTS.md`.

Report the measured after-numbers alongside the baseline table above. If any
task turns out to be blocked or wrong, stop and say so rather than working
around it — the diagnosis above is evidence-backed, so a contradiction means
something has changed and is worth surfacing.
````

---

## Task summary

| # | Task | Type | Risk |
|---|---|---|---|
| 1 | Cover resolver + universal cover endpoint + CDN headers | code | low |
| 2 | `coverSrc` never returns a data URI | code | low — **cuts payloads ~99%** |
| 3 | Stop selecting blob columns in list/series queries | code | low — **un-breaks the home page** |
| 4 | RSS feed stops emitting data URIs | code | low |
| 5 | Upload route fails loudly instead of persisting a blob | code | low — stops recurrence |
| 6 | Migrate the stored covers to Cloudinary | **data** | needs backup |
| 7 | Backfill remaining dimensions with sharp | **data** | low |
| 8 | Surface degraded sections; trim archive prefetching | code | low |
| 9 | Verify against production and record numbers | verification | none |

Tasks 2 and 3 carry almost all the benefit and touch two files between them.
If you want the smallest possible first deploy, ship 1-3 and stop; 4-9 are
hardening, data cleanup, and proof.
