# Thoughts.Whatever performance investigation — 2026-09-27

## Executive summary

The Reference catalogue had a measured data path bottleneck. Its two visible cards caused Prisma to retrieve full work, edition, rights and asset records, including large text/JSON fields, and five separate catalogue counts. An alternating 20-pair workstation experiment found median data fetch time of 903 ms before and 614 ms with precise selection plus a grouped count. A local production build, measured with 20 complete responses per version, changed from 797 to 648 ms median and 964 to 692 ms P95. This is an observed local improvement, not proof that intermittent production latency is eliminated. The changed build is not deployed.

Production Reference TTFB was 271 ms median and 338 ms P95 across 20 requests from this workstation, with complete responses at 328 and 415 ms. Several other public routes were similar. A single Search index request took 1.17 seconds, but 20 requests do not establish a stable P99. Authenticated admin requests could not be profiled because the available saved cookies were expired. Its server-side data loaders were benchmarked separately without authentication, layout or rendering.

## Architecture and request path

Next.js 14.2.35 App Router, React 18, Prisma 6.19.3 and PostgreSQL via Supabase pooler (`ap-south-1`, port 6543, configured connection limit 5). Vercel public responses carried a `bom1` edge identifier. `src/lib/prisma.ts` reuses one PrismaClient per warm process. The Reference route is `force-dynamic`; middleware performs public content negotiation, with no public authentication lookup. The route builds filters from URL parameters, then concurrently fetches filtered count, 12 card records and global catalogue statistics. Data is rendered on the server, passed to client `ReferenceCard`, then hydrated under global providers. Admin requests undergo middleware JWT verification followed by `requireAdmin()` in the layout; the dashboard starts several analytics queries before rendering its client dashboard. Search is a client page that fetches `/api/search-index` after hydration.

`graphify-out/graph.json` was checked first. It contains Prisma and middleware nodes but no connecting edges for this path. The graphify CLI failed through its uv trampoline, so source inspection supplied the map.

## Reproduction and stage evidence

| Measurement | Before | After | Context |
| --- | ---: | ---: | --- |
| Reference complete response median | 797 ms | 648 ms | 20 local production requests per version, same host/workstation |
| Reference complete response P95 | 964 ms | 692 ms | Same condition; every response had two cards and no stream error |
| Reference TTFB median | 52 ms | 57 ms | Streaming shell begins before database results; not data readiness |
| Reference data loader median | 903 ms | 614 ms | 20 alternating DB comparisons from workstation |
| Reference data loader P95 | 939 ms | 650 ms | Same comparisons |
| Prisma returned data size | 504 KB | 65 KB | Values fetched by the 12-card query, not RSC wire size |
| SQL events per complete data load | 33 example | 21 example | Prisma query events include relation queries; 1 run example |

The final local server trace recorded count ~171–174 ms, statistics ~184–192 ms and cards ~592–606 ms in overlapping stages. These durations include driver, pool and network time. They cannot be summed. An `EXPLAIN (ANALYZE)` of grouped catalogue counts took 0.056 ms in PostgreSQL on this dataset (two rows), so SQL execution of that aggregate was not the meaningful delay. From the workstation, Prisma `$connect()` took 347–382 ms in two probes and warm `SELECT 1` median took 181–191 ms. `$connect()` is startup, not a measurement of pool checkout per request. Prisma's query events are also not pure database execution times. The evidence implicates round trips and excess transferred data; it does not isolate connection acquisition or prove production database latency.

## Cross-page findings

20 workstation loader runs, median/P95 in ms: home initial loaders 555/587; archive loaders 412/446; series list 487/514; authors list 186/191; story primary loader 822/839; author detail loader 560/573; admin dashboard data 707/815. These are loader timings only. The diagnostic ran without React request cache, authentication, server rendering or client hydration. Admin layout authenticates in addition to the measured dashboard loaders. The original uncommitted benchmark could not profile Home because it queried a nonexistent `Series.featured` field; the script was corrected to select series with published pieces.

20 production HTTP samples per route gave TTFB median/P95 (ms): home 278/360, Reference 271/338, archive 275/357, series 275/333, authors 275/444, search 279/320, Reference audio filter 262/326, Search index API 257/319. `/admin` returned 307 to login; its 254/331 ms redirect times say nothing about authenticated dashboard speed. These shared public figures suggest transport/edge overhead warrants attention, but cannot apportion time between routing, server, database and CDN. Production cache headers showed Reference sometimes `x-vercel-cache: HIT` while `Cache-Control` was private and `CDN-Cache-Control` was public; the exact cache behavior needs deployment inspection before changing it.

Three Chrome contexts were sampled before any deployment. The Reference route already rendered cards from server data. In a shared warm context it showed 15 font resources and roughly 364 KB encoded script resources; one Reference first navigation had LCP 668 ms, repeat hard navigation 244 ms. A fresh Home navigation had 15 font resources and LCP 1032 ms. Search initiated `/api/search-index` at roughly 389 ms after navigation in one trace, which is a genuine client request after the page shell. These samples are descriptive only. Subsequent routes in each context share cache/connections; the original browser collection accidentally overwrote page errors with an empty field and was corrected for the later run. DOM article arrival is not hydration or visual presentation; soft-link timing includes a fixed 300 ms observation window and is not content-ready timing. No significant CLS was observed in sampled routes. `next/image` is used for Reference cards with responsive sizes; images still need a production trace before attributing intermittent delay to them. No evidence implicated CSS or third-party scripts as the Reference data bottleneck.

## Changes and validation

`src/lib/reference/catalogue.ts` selects only fields used for cards and the rights engine, retaining `transcriptText` for transcript-only reading. Live global counts use `groupBy` plus one source count; filter-specific total remains independent. `src/lib/performance-trace.ts` adds `PERFORMANCE_TRACE=1` timing for the Reference count, cards and statistics, with a request ID and durations only. It records failures without message, SQL, content or credentials and has no timing/log overhead when disabled. `EditorialImage` had an existing early return before hooks; an image error reproduced a React hook-order crash. The early return now follows all hooks.

Jest: 29 suites and 256 tests passed, including the new catalogue, timing and image-error tests. TypeScript passed. ESLint passed. The final production build completed. The first post-change build failed with a worker out-of-memory error while other diagnostics were active; the subsequent clean build succeeded. The standard prompt sync scanned 431 existing Antigravity prompts and inserted zero. The current Codex brief, URL and follow-up were then synchronized explicitly to `PromptLog` as three new records using `scripts/sync-codex-performance-prompt.ts`.

## Remaining limits and next production checks

The production deployment has not changed, so there is no production after result or proof of tail-latency elimination. Authenticated admin navigation, per-request pool acquisition, browser hydration completion, React commit time, serverless cold starts, region placement of application versus DB, true RSC transfer size and P99 need deployment-side tracing. The configured DB hostname reveals the pooler region, but app process and storage regions are not established. Enable `PERFORMANCE_TRACE=1` briefly in the deployment, collect correlated slow and fast Reference requests, and compare those stages with real-user navigation, RSC and LCP observations. Investigate the client Search request and admin dashboard only with their own before/after evidence; do not infer they improved from this Reference edit.

## Raw measurements

- `production-baseline-http.json`: 20 sequential public HTTP samples per route.
- `reference-database.json`: alternating Reference query trials, SQL event durations, transfer sizes and aggregate execution plan.
- `local-before-valid-http.json`, `local-after-http.json`: same production build setup before/after, 20 valid complete responses each.
- `cross-page-database.json`: 20 read-only loader samples per major page.
- `production-baseline-browser.json`, `production-verified-browser.json`: small browser samples; see limitations above.
- `server-after.log`: local opt-in Reference operation trace.
