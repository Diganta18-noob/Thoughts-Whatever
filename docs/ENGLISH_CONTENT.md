# English content and reference display

The language setting now applies to page headings, body copy, navigation, accessible labels, and browser titles. The English view uses local translation entries and the Bengali view restores the source text.

## Current coverage

`locales/content-en.json` contains 336 English passages, labels, and existing English source fields. It includes the Contact, Privacy, About, and saved-page copy, every timeline milestone with its expanded context and key points, all timeline FAQs, and English titles/names already present in published records.

The public pages use React translation boundaries. These translate text nodes and descriptive attributes while preserving element structure, URLs, refs, and event handlers. Code, JSON-LD, SVG assets, language-option names, and the original contents of scans remain intact.

Opaque component child contracts are preserved: Markdown continues to receive strings, and single-child consumers retain their element input. Public links use a client wrapper that localizes their own child slot after React Server Component resolution.

## Bundled-only operation

The user selected bundled translations only. No live translation API or provider client is included, and the English view makes no requests to OpenRouter or another translation provider. The existing unrelated audio-transcription integration is outside this change.

Unknown English text is explicitly marked unavailable. Literary bodies without a bundled English version show one availability message and a button to read the original Bengali. Scanned archival pages are labeled as originals when an English transcription is absent. This change does not invent or claim English translations for the complete literary corpus or scanned editions.

To refresh the bundle, run these in order:

1. `node scripts/bundle-english-page-copy.cjs`
2. `npx tsx scripts/bundle-english-timeline.ts`
3. `npx tsx scripts/bundle-published-english.ts` (requires database access; reads only published English fields)

## Reference controls

Public-domain badges, their catalog filter, and PDF/audio download controls are removed from the public reference interface. Reading, listening, source links, stored rights metadata, and the backend rights checks remain available. The rights policy's explanatory discussion of copyright categories remains a policy document.

## Verification

The targeted translation/reference suite contains 21 passing tests, including Markdown child-shape and link-slot regressions. `scripts/check-english-content.cjs` verifies the five affected page routes, reversible EN/BN switching, real article Markdown rendering, no translation API requests, and absence of public-domain badges and download anchors on the catalog and two reference detail pages. The report is `docs/qa/english-content-audit.json`.
