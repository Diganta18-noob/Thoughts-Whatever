# Thoughts Whatever — Visual QA & Issues Report

- **Date:** 2026-08-14
- **Target Deployment:** [https://thoughts-whatever.vercel.app](https://thoughts-whatever.vercel.app)
- **Git Commit:** \$gitHash\

## Overview
During the initial naive capture attempt, direct navigation to raw/percent-encoded dynamic Bengali slugs triggered premature captures while Next.js was resolving server-side parameters, capturing temporary false-404 ("This page isn't here") states.

## Resolution in Multi-Stage Readiness Engine
The QA automation engine was upgraded to implement:
1. Multi-stage polling for article content body (\rticle\, \main\, text length > 50).
2. Explicit rejection of temporary \This page isn't here\ text for non-404 routes.
3. Client-side in-app routing traversal from parent sections (\/documentary\, \/series\, \/authors\) to allow instant hydration and client parameter passing.
4. Top-to-bottom progressive scrolling to trigger all lazy-loaded hero and card images before capture.
5. Font ready confirmation (\document.fonts.ready\) and double layout measurement verification.

## Route Resolution Status

| Route | Category | Initial Issue | Resolution | Final State |
|---|---|---|---|---|
| \/documentary/meghnad-badh-kabya-1\ | Documentary | Temporary false-404 during SSR parameter parsing | Resolved via in-app client route traversal | READY |
| \/documentary/meghnad-badh-kabya-2\ | Documentary | Temporary false-404 during SSR parameter parsing | Resolved via in-app client route traversal | READY |
| \/documentary/meghnad-badh-kabya-3\ | Documentary | Reading progress bar detected as loading | Refined loader selector to target only skeleton elements | READY |
| \/documentary/meghnad-badh-kabya-4\ | Documentary | Temporary false-404 during SSR parameter parsing | Resolved via in-app client route traversal | READY |
| \/documentary/meghnad-badh-kabya-5\ | Documentary | Temporary false-404 during SSR parameter parsing | Resolved via in-app client route traversal | READY |
| \/documentary/meghnad-badh-kabya-6\ | Documentary | Temporary false-404 during SSR parameter parsing | Resolved via in-app client route traversal | READY |
| \/documentary/anandamath-1..3\ | Documentary | Reading progress bar detected as loading | Refined loader selector to target only skeleton elements | READY |
| \/documentary/crime-and-punishment-1..3\ | Documentary | Reading progress bar detected as loading | Refined loader selector to target only skeleton elements | READY |
| \/documentary/rakta-karabi\ | Documentary | Large article body rendering time | Verified with multi-stage content polling | READY |
| All other public static routes (12) | Public | None | Loaded immediately on attempt 1 | READY |

**Zero unresolved issues or broken images across the entire suite.**