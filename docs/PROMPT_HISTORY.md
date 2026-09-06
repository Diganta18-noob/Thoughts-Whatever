# Thoughts Whatever — Prompt History & Master Debug Log

This document records all master prompts, feature requests, and debug directives given during the recovery, optimization, and bug-fixing session for `https://thoughts-whatever.vercel.app/`.

---

## 1. Initial Git & Codebase Alignment
```text
git pull the code
```

---

## 2. Master Prompt 1 — Fix Infinite Loading, Restore Skeleton UI & Initial Rendering
```text
MASTER PROMPT — FIX INFINITE LOADING, RESTORE SKELETON UI & OPTIMIZE INITIAL RENDERING

PROJECT: Website: https://thoughts-whatever.vercel.app/
Production Bengali literature / close-reading / documentary website.

CURRENT SYMPTOM:
The website sometimes stays on "LOADING..." for more than 1 minute.
The header and footer render correctly, but main content stutters or deadlocks.

GOAL:
- Diagnose root causes of data/rendering deadlocks.
- Restore structured skeleton loading UI across all public routes.
- Enable resilient fallback states so cold database starts never block rendering.
```

---

## 3. Deployment Directive
```text
push it
```

---

## 4. Admin Portal Access Request
```text
give me the admin pass
```

---

## 5. Admin Portal Credentials Specification
```text
admin@thoughts.whatever.com this should be the email and [REDACTED] the password
```

---

## 6. Hero Section Alignment & Bengali Subtitle Removal
```text
"রিলে যা কয়েক মিনিটে বলা যায়, তার পুরোটা এখানে লেখা থাকে। সাহিত্য, পাঠ, আর তার পিছনের ইতিহাস — সূত্র সমেত।" 
Delete this Bengali line and I want that "Thoughts Whatever" line to be responsive and in linear alignment of the page.
```

---

## 7. Master Prompt 2 — Database, API, Authentication & Data-Flow Recovery Plan
```text
MASTER DEBUG & RECOVERY PLAN
PROJECT: THOUGHTS WHATEVER

Production: https://thoughts-whatever.vercel.app/

CRITICAL CURRENT SYMPTOMS:
- /documentary loads page shell but shows "0 PIECES" and "No documentaries published yet."
- Main site appears to have missing database-backed content.
- Admin login failing after migration to new MongoDB Atlas database.

TASKS:
- Audit database connection and migration status.
- Implement auto-bootstrapping for admin credentials (admin@thoughts.whatever.com / [REDACTED]).
- Ensure public queries fetch published content reliably.
```

---

## 8. Deployment Health Check
```text
check the latest commit is getting deployed or not in vercel , i think it got crashed
```

---

## 9. Master Prompt 3 — Restore Homepage Content Glimpse & Admin Login
```text
previously i have implemented in main page it should show some content glimpse check the previous version of the website in main page some of the content photo and recent uploaded photo is being shown for glimpse of the content , i want that back , and i am not able to login in admin portal with the new admin passs , first plan what u have to do and make a task todo and fix the problems
```

---

## 10. Continuation Directive
```text
continue
```

---

## 11. Master Prompt 4 — Fix Page Refresh Loading Hang
```text
the website is not getting render means if i refersh the page it got stuck on the refersh loading state and it is not geetting render , first make a implementation plan and make a task todo to fix the issue . then fix those
```

---

## 12. Deployment Verification
```text
check the vercel deployment status  ,  it think u got fail
```

---

## 13. Master Prompt 5 — Fix Piece Status Archiving
```text
i have update the achived in the status and update and it is not geetting achived and not getting archive in any thing , achive is not working try to fux it
```

---

## 14. Master Prompt 6 — Fix "Invalid ID format." Validation Error
```text
it is showing Invalid ID format. . fix it
```

---

## 15. Documentation Directive (Initial)
```text
now store the all prompt i have made now
```

---

## 16. Master Prompt 7 — Build-Time Pool Exhaustion & Prerendering Failure (`EMAXCONNSESSION`)
```text
02:28:02.181 Error occurred prerendering page "/authors".
02:28:02.183 Error in connector: Error querying the database: FATAL: (EMAXCONNSESSION) max clients reached in session mode - max clients are limited to pool_size: 15
> Export encountered errors on following paths:
/admin/(dashboard)/analytics/page: /admin/analytics
/authors/page: /authors
Error: Command "npm run build" exited with 1

the previous eror log
```

---

## 17. Master Prompt 8 — Admin UI Feedback Standardization
```text
the messgae should be in toast message and it should be in english
```

---

## 18. Master Prompt 9 — Build Failure P2024: Connection Pool Exhaustion on Prerender Routes
```text
13:25:05.865 code: 'P2024', meta: { modelName: 'Series', connection_limit: 1, timeout: 10 }
13:25:05.868 Error occurred prerendering page "/series/crime-and-punishment"
13:25:05.868 Timed out fetching a new connection from the connection pool. (Current connection pool timeout: 10, connection limit: 1)
at async /vercel/path0/.next/server/app/api/search-index/route.js:1:15445
> Export encountered errors on following paths:
/series/[slug]/page: /series/crime-and-punishment
Error: Command "npm run build" exited with 1
```

---

## 19. Environment Configuration Guidance
```text
tell me what update i need to make in vercel env for database url
```
```text
give me
```
```text
update this on this project local env
```

---

## 20. Master Prompt 10 — Visual Reference Baseline Archive
```text
Implementation Plan - Complete Visual Reference Screenshot Archive
Capture an automated, comprehensive baseline archive of every public, dynamic, admin, theme, and viewport state across the entire website before applying further refactors.
```

---

## 21. Master Prompt 11 — Stuck Skeleton & Invisible Reveal Elements Analysis
```text
why this things is also
```
```text
option 1
```
```text
Master Plan - Thoughts Whatever: Stuck Skeleton Fix
Root Cause Analysis & Fix Plan for Framer Motion SSR initial opacity:0 serialization vs React 18 hydration bailout on mobile / slow connections.
```

---

## 22. Rollback Directive — Revert Hydration Safety Net to Restore Sub-Second Refresh
```text
push it
```
```text
go back to previous commit , because after refersh it takes sometime to load, it should be referssj within a sec
```

---

## 23. Master Prompt 12 — API Architecture & Performance Evaluation
```text
see how many api call is happening, is it healty metthod , is it a good way to make a dedicated single api within single api the all api call willbe there for better preformance .
```

---

## 24. Repository Synchronization & Push Directive
```text
pull the code
```
```text
push the last day all prompt
```

---

## 25. Master Plan — Stuck Skeleton Fix (Framer Motion SSR & Hydration Resilience)
```text
Master Plan — Thoughts Whatever: Stuck Skeleton Fix
Root Cause Report (Confirmed):
1. CSS Safety Net: @keyframes reveal-rescue with 200ms fallback for [data-reveal]
2. ThemeScript & Hydration Fix: Synchronize tw_theme and tw_lang cookies across SSR layout and client
3. Self-healing Reveal Component: useInView + useAnimation with 300ms IntersectionObserver miss detection
4. Database Query Timeout: 8-second Promise.race timeout in page.tsx with router.refresh error recovery
5. Production Diagnostic Logging: NEXT_PUBLIC_DEBUG_LOADING diagnostic telemetry in debug.ts
```

---

## Complete Summary of Solutions Executed

| # | Prompt Topic | Root Cause | Solution Applied |
|---|---|---|---|
| 1 | Infinite `LOADING...` | Layout-level `revalidate = 0` override & missing query timeouts | Re-enabled ISR (`revalidate = 300`), added `withTimeout` safeguards & restored full skeleton UI |
| 2 | Admin Login Failure | Database migration to new MongoDB Atlas instance | Added auto-bootstrapping inside `POST /api/admin/login` for `admin@thoughts.whatever.com` / `[REDACTED]` |
| 3 | Missing Content Glimpse | `<FeaturedSeriesHero>` missing from homepage | Re-integrated `<FeaturedSeriesHero>` with 9/16 cover frame and episode progress pill |
| 4 | Page Refresh Loading Hang | Sequential `await` queries & cold serverless execution | Converted to parallel `Promise.allSettled` with 2.5s timeouts and React `<Suspense>` streaming |
| 5 | Archiving Status Not Working | Missing `PUBLISHED` status filter in `getRecentPieces` | Enforced `{ status: "PUBLISHED" }` on public queries so `ARCHIVED` pieces are automatically hidden from public site |
| 6 | "Invalid ID format." Error | `isValidCuid` only accepted legacy CUIDs | Updated `isValidCuid` regex in `admin-api.ts` to accept 24-character MongoDB ObjectIds |
| 7 | Supabase PostgreSQL Migration | MongoDB ObjectId indexing bottlenecks and complex relations | Migrated database to Supabase PostgreSQL with normalized relational foreign keys |
| 8 | Auto Database Snapshots | Missing automated disaster recovery on production mutations | Implemented `backupDatabase()` snapshot engine triggering timestamped JSON exports on mutations |
| 9 | `EMAXCONNSESSION` on Build | Build workers opening unpooled database connections simultaneously | Configured Supabase Session Pooler with `pgbouncer=true`, connection limits, and defensive fallbacks |
| 10 | P2024 Build Pool Starvation | `/api/search-index` fetching full markdown during static page generation | Set `runtime = "nodejs"` on dynamic search index and added `build-params.ts` shared slug deduplication cache |
| 11 | Visual Baseline Archive | Lack of permanent visual regression reference | Built automated Playwright snapshot runner generating ~185 screenshots across all routes and viewports in `SCREENSHOT_INDEX.md` |
| 12 | Hydration Stuck Skeleton | Framer Motion SSR HTML opacity:0 serialization race | Diagnosed hydration interaction; rolled back heavy client wrapper to preserve sub-second native ISR load speed |
| 13 | API Architecture Audit | Question regarding multi-endpoint vs consolidated single-API performance | Audited Next.js App Router Server Component direct DB execution vs client REST calls, verifying current architecture is optimal |
| 14 | Stuck Skeleton Permanent Fix | Framer Motion SSR opacity:0 serialization and ThemeScript hydration mismatches | Added CSS reveal-rescue safety net, cookie-synced ThemeScript, 300ms miss-healing Reveal, 8s DB timeout, and diagnostic logging |
| 15 | Advanced Editor's Room Admin Portal Upgrade | Editorial OS required across CMS, Analytics, SEO, and Workflow | Built 20+ features across 6 phases with editorial aesthetics and schema tools |
| 16 | Global Toast Notification System Refactoring | Mixed browser alerts and notifications across modules | Centralized custom toast notification system with destructive confirmations |
| 17 | Brand Search & Entity Optimization ("Thoughts Whatever") | Domain indexed on page 14 via /blog with generic brand disambiguation | Established unified Schema.org entity graph (Org, WebSite, WebPage, About, Blog), reinforced canonicals, and strengthened homepage brand authority |

---

## 26. Master Prompt 15 — Advanced Editor's Room Admin Portal Upgrade
```text
MASTER PROMPT — Advanced Editor's Room Admin Portal Upgrade

Goal: Transform the existing Editor's Room admin portal into a powerful, professional editorial operating system.
Scope: 20+ features across 6 phases covering CMS, Analytics, SEO, Editorial Workflow, Team Collaboration, Infrastructure Monitoring, Automation, Security, AI Intelligence, and Data Graphing.
Design Guardrails: Preserve editorial magazine-inspired aesthetic, warm off-white/cream background, dark charcoal typography, muted rust accent, thin borders, serif headings, uppercase tracking, minimal icons, zero neon/glassmorphism.
```

---

## 28. Master Prompt 17 — Brand Ranking & Entity Search Optimization ("Thoughts Whatever")
```text
MASTER TASK — MOVE “THOUGHTS WHATEVER” FROM GOOGLE PAGE 14
TO PAGE 1–5 FOR THE BRAND QUERY

TARGET WEBSITE:
https://www.thoughtswhatever.in

PRIMARY BRAND:
Thoughts Whatever

OBJECTIVE:
Elevate official domain visibility from page 14 towards page 1-5 by establishing clear entity graph (Organization -> WebSite -> WebPage/CollectionPage -> Article), refining canonical metadata, enhancing About page authority, and strengthening homepage identity.
```

---

## 29. Master Prompt 18 — Knowledge Graph Database Persistence (Graphify Sync)
```text
STORE GRAPHIFY KNOWLEDGE GRAPH IN POSTGRESQL DATABASE

OBJECTIVE:
Persist full Graphify knowledge graph outputs (KnowledgeGraph snapshot, KnowledgeGraphNode, and KnowledgeGraphEdge models) into Supabase PostgreSQL for persistent querying, relational analysis, and automated synchronization via `npm run save-graphify`.
```

---

## 30. Master Prompt 19 — Landscape Master Format Image Generation
```text
LANDSCAPE MASTER FORMAT (16:10 / 16:9) THUMBNAIL EXPANSION

OBJECTIVE:
Generate landscape versions of existing portrait thumbnails for website sections (Hero section and Series Title images). Intelligently outpaint canvas (extending left and right environments) while preserving central subject, faces, objects, original lighting, color grading, and Bengali typography. Save outputs in a separate dedicated landscape directory preserving original filenames. Provide a demo image first for user approval.
```

---

## 31. Master Prompt 20 — Crime and Punishment Landscape Renaming & Folder Mirroring
```text
CRIME AND PUNISHMENT LANDSCAPE RENAMING & FOLDER STRUCTURE MIRRORING

OBJECTIVE:
Inspect generated landscape images in `Content/Thumnail Landscape/Crime and punishment` and rename them matching original thumbnail conventions:
- 254e70c8-a5f8-4e68-99d8-57bfe672aa56.png -> Crime and punishment 1.PNG
- dee7058c-2dfe-4d8b-9ca5-4d774fb6d0fa.png -> Crime and punishment 2.PNG
- ChatGPT Image Sep 5, 2026, 02_49_27 PM.png -> Crime and punishment 3.PNG

Mirror all thumbnail category directories from `Content/Thumnail` into `Content/Thumnail Landscape`:
- Solo, আনন্দমঠ, চোখের বালি, নীলদর্পণ, পথের দাবী, মেঘনাদবধ কাব্য  Series.
```

---

## 32. Master Prompt 21 — Unique Identifier Suffix for Landscape Thumbnails
```text
LANDSCAPE THUMBNAIL UNIQUE IDENTIFIER SUFFIX

OBJECTIVE:
To prevent naming collisions and visual confusion between portrait and landscape images across File Explorer and website components, append a distinct unique suffix (` - Landscape`) to all landscape thumbnail filenames in `Content/Thumnail Landscape/`:
- `Crime and punishment 1 - Landscape.PNG`
- `Crime and punishment 2 - Landscape.PNG`
- `Crime and punishment 3 - Landscape.PNG`
- `চোখের বালি - Landscape.PNG`
```

---

## 33. Master Prompt 22 — Solo Landscape Images Inspection, Renaming & Folder Sorting
```text
SOLO LANDSCAPE IMAGES INSPECTION, RENAMING & SORTING

OBJECTIVE:
Inspect newly pasted landscape images in `Content/Thumnail Landscape`, identify each novel/series title from visual content, rename them with the ` - Landscape` suffix matching original thumbnail conventions, and move them into their designated subfolder (`Content/Thumnail Landscape/Solo`):
- 150b9cbc-a82d-4c87-9c56-33f7d51ebcbb.png -> Solo/Frankenstein - Landscape.PNG
- 5116a4e2-e527-41c0-8cb5-32b29c4f614b.png -> Solo/ঘরে-বাইরে - Landscape.PNG
- 5339affe-7c9d-45db-b8e4-b24a554f1a67.png -> Solo/দেবী - Landscape.PNG
- ba74597d-6e00-4318-a21b-b04b6467f4d8.png -> Solo/কপালকুন্ডলা - Landscape.PNG
- deea88b0-8eea-41a3-904f-bb6e4dea4b6f.png -> Solo/ক্ষুদিরাম বসু - Landscape.png
```

---

## 34. Master Prompt 23 — Revised Frankenstein & Kapalkundala Landscape Organization
```text
REVISED FRANKENSTEIN & KAPALKUNDALA LANDSCAPE IMAGES SORTING & RENAMING

OBJECTIVE:
Inspect newly pasted landscape images in `Content/Thumnail Landscape`, identify revised compositions:
- 0390b983-8203-45c0-8e20-3ff0249dcb27.png -> Frankenstein (Mary Shelley) revised composition
- 1ef40fc2-0cda-44e8-a944-365cdb69dcf3.png -> কপালকুণ্ডলা (Bankimchandra) full quote & enhanced composition

Organize into `Content/Thumnail Landscape/Solo/` with the standard ` - Landscape.PNG` convention while retaining previous revisions as `(v1)`.
```

---

## 35. Master Prompt 24 — Roktokorobi & Padma Nadir Majhi Landscape Organization
```text
ROKTOKOROBI & PADMA NADIR MAJHI LANDSCAPE IMAGES SORTING & RENAMING

OBJECTIVE:
Inspect newly pasted landscape images in `Content/Thumnail Landscape`, identify titles:
- 981d49d2-8e88-4216-8c33-7145f4f1223f.png -> রক্তকরবী (Rabindranath Tagore)
- eceec847-1eb3-4746-8ae2-d6b88edcf254.png -> পদ্মা নদীর মাঝি (Manik Bandopadhyay)

Organize into `Content/Thumnail Landscape/Solo/` with the standard ` - Landscape.PNG` convention, completing the full Solo collection (7 of 7 titles).
```

---

## 36. Master Prompt 25 — Content Upload Pipeline: চিত্ত যেথা ভয় শুন্য (রবীন্দ্রনাথ ঠাকুর)
```text
চিত্ত যেথা ভয় শুন্য
______রবীন্দ্রনাথ ঠাকুর  date [August 12](https://www.instagram.com/thoughts.whatever_/reel/Db8gHrhNLUc/)

i  have update the context folder now start the content upload pipeline with date and instragram link
```

---

## 37. Elimination of External AI Dependency from Content Pipeline
```text
i dont want any ai to be use for perticular this thing
```

---

## 38. Master Prompt 26 — Rename Chitta Jetha Bhayshunyo Landscape Thumbnail
```text
D:\Antigravity\thoughts-whatever\Content\Thumnail Landscape\Solo chnage the name of the thumnail 
```

OBJECTIVE:
Inspect newly added landscape image `e1d846f3-28f1-4310-a174-905537c7eba1.png` in `Content/Thumnail Landscape/Solo`, identify as Rabindranath Tagore's "চিত্ত যেথা ভয়শূন্য", and rename to `চিত্ত যেথা ভয় শুন্য - Landscape.png`.

---

## 39. Master Prompt 27 — Anandamath Landscape Thumbnails Organization
```text
D:\Antigravity\thoughts-whatever\Content\Thumnail Landscape\আনন্দমঠ rename the landscape thumnail as per the thumnail folder
```

OBJECTIVE:
Inspect newly added landscape images in `Content/Thumnail Landscape/আনন্দমঠ`, identify episode numbers from visual cues ("প্রথম পর্ব", "দ্বিতীয় পর্ব", "শেষ পর্ব"), and rename them matching the portrait thumbnail convention in `Content/Thumnail/আনন্দমঠ`:
- `efdb5092-e147-4d2d-8677-bf3a196e7a46.png` ("প্রথম পর্ব") -> `আনন্দমঠ 1 - Landscape.png`
- `58b2a6e8-be66-46e2-801f-c0599e045f3d.png` ("দ্বিতীয় পর্ব") -> `আনন্দমঠ 2 - Landscape.png`
- `6f5f300d-04bd-4adf-b0cc-8a7bc3384758.png` ("শেষ পর্ব") -> `আনন্দমঠ 3 - Landscape.png`

---

## 40. Master Prompt 28 — Chokher Bali Landscape Thumbnails Organization
```text
D:\Antigravity\thoughts-whatever\Content\Thumnail Landscape\চোখের বালি rename the landscape thumnail as per the thumnail folder
```

OBJECTIVE:
Inspect newly added landscape images in `Content/Thumnail Landscape/চোখের বালি`, identify episode numbers from visual cues ("চোখের বালি", "পর্ব - ২", "অন্তিম পর্ব"), and rename them matching the portrait thumbnail convention in `Content/Thumnail/চোখের বালি`:
- `462ffff4-0bf9-4d2e-905c-84436b9778ff.png` (Episode 1) -> `চোখের বালি - Landscape.png`
- `bb4ac7dd-455e-4c1d-9205-b1a607bfa5c5.png` ("পর্ব - ২") -> `চোখের বালি  পর্ব-২ - Landscape.png`
- `1815db0a-a309-494a-a1c4-e9f0e707c978.png` ("অন্তিম পর্ব") -> `চোখের বালি   অন্তিম পর্ব - Landscape.png`

---

## 41. Master Prompt 29 — Nildarpan Landscape Thumbnails Organization
```text
D:\Antigravity\thoughts-whatever\Content\Thumnail Landscape\নীলদর্পণ rename the landscape thumnail as per the thumnail folder
```

OBJECTIVE:
Inspect newly added landscape images in `Content/Thumnail Landscape/নীলদর্পণ`, identify episode numbers from visual cues ("নীলদর্পণ", "দ্বিতীয় পর্ব", "অন্তিম পর্ব"), and rename them matching the portrait thumbnail convention in `Content/Thumnail/নীলদর্পণ`:
- `8731af7b-9dea-478c-b108-302d823b286c.png` (Episode 1) -> `নীলদর্পণ - Landscape.png`
- `3055f9e5-7d22-4f2f-a11d-124e8ae2d78b.png` ("দ্বিতীয় পর্ব") -> `নীলদর্পণ পর্ব - ২ - Landscape.png`
- `1cd04b1d-4ef5-4a1b-9679-df8cdfd695f0.png` ("অন্তিম পর্ব") -> `নীলদর্পণ অন্তিম পর্ব - Landscape.png`

## 42. Master Prompt 30 — Pather Dabi Final Episode Thumbnail Cloudinary & Database Update
```text
D:\Antigravity\thoughts-whatever\Content\Thumnail\পথের দাবী

i have change on eimage in the thumbnail on the last photo names পথের দাবী অন্তিম পর্ব , just chnage the photo in the database so that it will chnage in the website
```

OBJECTIVE:
Upload newly updated thumbnail image `Content/Thumnail/পথের দাবী/পথের দাবী অন্তিম পর্ব .png` to Cloudinary CDN under folder `episodes/পথের-দাবী` and update PostgreSQL database piece record for `পথের-দাবী-3` (`cmtevwu070006kjms77me3i89`) with the new CDN `coverImage` URL, `ogImage`, and dimensions.

## 43. Master Prompt 31 — 3-Tier Image Asset Hierarchy System
```text
Implementation Plan — 3-Tier Image Asset Hierarchy System
What the audit found (exact current state):
Homepage hero card: FeaturedSeriesHero -> 3:4 portrait (coverImage)
Homepage featured writing: FeaturedHeroSpread -> 16:10 landscape (needs thumbnailImage)
Homepage latest stories: SupportingEditorialItem -> 16:9 landscape (needs thumbnailImage)
Homepage latest episodes: EpisodeCard -> 16:9 landscape slot (needs thumbnailImage)
Series index cards: SeriesCard -> 3:4 portrait (series.coverImage)
Series detail hero: SeriesHeroBanner -> 21:9 cinematic key art (series.bannerImage)

ASSET TYPE         FIELD NAME       RATIO    WHERE USED
────────────────────────────────────────────────────────────────────
Poster / Identity  coverImage       9:16     Series cards, FeaturedSeriesHero, ArticleCard split/hero, social OG
Episode Thumbnail  thumbnailImage   16:9     LatestEpisodes grid, SupportingEditorialItem, ArchiveCards, RelatedPieces cards
Series Key Art     bannerImage      21:9     Series detail page hero ONLY
────────────────────────────────────────────────────────────────────
```

OBJECTIVE:
Implement end-to-end 3-tier visual asset system across PostgreSQL database schema (`Piece.thumbnailImage`, `Series.bannerImage`), data fetching layer (`pieces.ts`), image resolution helpers (`images.ts`), UI components (`LatestEpisodes`, `FeaturedWriting`, `SeriesHeroBanner`), admin CMS editor & APIs, and editorial documentation (`IMAGE-ASSET-SYSTEM.md`).

---

## 44. Master Prompt 32 — Premium Editorial Cinematic Hero Slider
```text
MASTER PROMPT — Premium Editorial Cinematic Hero Slider
PROJECT: thoughts.whatever (thoughtswhatever.in)

CORE PHILOSOPHY:
Criterion Collection / HBO documentary / high-end editorial journalism.
Cinematic, dark, minimal, intelligent, story-focused.

STRUCTURE:
- Desktop 2.1:1 container (40-45% Left Content Area + 55-60% Right Visual Area).
- Dedicated 16:9 landscape artwork with seamless horizontal gradient mask blending edge-to-edge into website dark background.
- Typography: Eyebrow "FEATURED STORY", large Bengali title, category/date/reading-time metadata, 2-3 lines description, minimal editorial CTA button.
- Editorial timeline navigation: 01 ━━━━━━━ 02 ─────── 03 ─────── 04 with animated progress line, PREV/NEXT buttons, keyboard and touch swipe controls.
- Fade + subtle Ken Burns zoom transition (no mechanical horizontal sliding).
- Mobile stacked layout with top landscape artwork and responsive editorial content below.
- Branch: feature/cinematic-hero-slider
```

OBJECTIVE:
Build `FeaturedHeroSlider`, `FeaturedHeroSlide`, and `FeaturedHeroNavigation` in `src/components/home/featured-hero/` and integrate into `src/app/page.tsx`, replacing the static single featured card on the `feature/cinematic-hero-slider` branch.

---
