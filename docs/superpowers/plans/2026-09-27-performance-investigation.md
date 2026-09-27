# Performance investigation plan

**Goal:** Identify measurable causes of intermittent data visibility latency, starting with Reference, and implement only demonstrated improvements.
**Spec:** `docs/performance/brief.md`
**Architecture:** Preserve App Router server rendering, live rights checks, authentication and existing cache semantics. Use read-only diagnostic scripts, then narrow query changes with regression coverage. Never label workstation database measurements as production server measurements.
**Stack:** Next 14.2.35, React 18, Prisma 6.19.3, PostgreSQL, Jest, Playwright.

## Tasks

- [ ] Audit source routes, database, providers, assets and deployment headers; record dependency map.
- [ ] Capture 20 sequential public HTTP samples per representative route and browser first/repeat/hard/soft navigation samples. Record failures separately. Test existing authenticated state only if valid; never invent credentials.
- [ ] Measure Prisma initialization, warm ping, actual SQL event count/duration, data transfer size, transformation and serialization. Do not mistake `$connect()` for per-request pool wait or query events for pure PostgreSQL execution.
- [ ] Compare original and proposed Reference selection and catalogue aggregation with alternating trials. Preserve transcript capability data, filters, pagination and live rights. Add regression tests before runtime edits.
- [ ] Add opt-in timing for the Reference data path if production attribution is unavailable. No request content, SQL, parameters, tokens or personal information in timing records.
- [ ] Run TypeScript, ESLint, Jest and production build; inspect production and development separately. Capture equivalent after measurements, leaving non-reproduced issues explicitly unresolved.
- [ ] Write `docs/performance/INVESTIGATION.md`, retain raw measurements, and run required prompt sync.

## Review focus

- Transcript-only resources retain online-reading capability.
- Restricted/unverified resources never gain hosted capabilities.
- Filtered totals differ from global catalogue totals correctly; zero rows remain supported.
- No large reader manifests or asset metadata are selected just for cards.
- Disabled diagnostics have no query/log side effects; failures propagate unchanged.

## Execution notes

Existing uncommitted `scripts/perf-benchmark.ts`, `scripts/test-reference-opt.ts` and prompt-history changes belong to the starting workspace and are preserved. Work stays in this checkout so measurements and changes use its existing configuration. No deployment or schema migration is needed for this investigation.
Graph was consulted first; Prisma has no adjoining edges and graphify CLI has a broken uv trampoline. Direct source inspection supplies the missing relationships.
