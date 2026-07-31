# Implementation Roadmap & Phases — Thoughts Whatever

## Phase 1: Foundation, Design System & Database (Completed ✅)
- Set up Next.js 14 App Router, Tailwind CSS, TypeScript, and Prisma ORM.
- Configured Google Fonts (`Noto_Serif_Bengali`, `Hind_Siliguri`, `Galada`, `Fraunces`, `Inter`, `JetBrains_Mono`).
- Defined HSL/RGB CSS variable reading themes (`cream`, `sepia`, `night`, `archive`).
- Designed and deployed PostgreSQL schema (`Piece`, `Series`, `Author`, `Tag`, `Subscriber`, `AdminUser`).

## Phase 2: Public Reader Experience & Core Layouts (Completed ✅)
- **Homepage (`/`)**: Built magazine-style layout featuring hero lead, featured writing grid, documentary archive section, and newsletter CTA.
- **Article Reader (`/writing/[slug]`, `/documentary/[slug]`, `/blog/[slug]`)**: Built universal reading engine with progress bar, typography controls, quote card picker, timeline events, citations source list, and audio narration player.
- **Documentary Archive (`/documentary`)**: Created dark-mode cinematic surface (`data-surface="archive"`).
- **Search & Hubs (`/search`, `/series`, `/authors`)**: Implemented client-side Fuse.js fuzzy search and series/author hub pages.

## Phase 3: Admin CMS & Content Management (Completed ✅)
- **Authentication**: JWT cookie-based admin session authentication and protected `/admin/*` middleware guard.
- **Piece Editor (`/admin/pieces`)**: Comprehensive 931-line Bengali editorial form supporting Markdown, live preview, timeline event builder, source citation manager, tags, authors, and media links.
- **Taxonomy Manager (`/admin/taxonomy`)**: CRUD interface for managing literary authors, themes, eras, and topic tags.

## Phase 4: Analytics Engine & Dashboard (Completed ✅)
- **Analytics Schema & Tracker**: Added `AnalyticsEvent` Prisma model and lightweight `tracker.ts` event ingestion (`POST /api/analytics/event`).
- **View Tracker Component**: Embedded passive client scroll milestone and page view tracker (`view-tracker.tsx`).
- **Interactive Analytics Dashboard (`/admin`)**: Built real-time stats overview, responsive SVG daily traffic chart (`trend-chart.tsx`), top articles table, and series completion rate tracker.

## Phase 5: Series Manager, Settings & Bulk Import (Completed ✅)
- **Admin Series Manager (`/admin/series`)**: Built episode reordering UI with automatic `seriesOrder` saving (`PUT /api/admin/series/[id]/reorder`).
- **Settings & Backup (`/admin/settings`)**: Implemented admin password updates, new admin creation, and full JSON database backup export (`GET /api/admin/settings?export=true`).
- **CSV Bulk Content Import (`/admin/import`)**: Client-side CSV parser and batch draft creator API (`POST /api/admin/import`).

## Phase 6: Accessibility, SEO & Production Polish (Completed ✅)
- Added WCAG 2.2 AA "Skip to content" link and `.sr-only` accessibility classes.
- Verified dynamic XML sitemaps (`/sitemap.xml`) and RSS 2.0 feed (`/rss.xml`).
- Executed `npm run build` — verified all 55 static and dynamic routes compile cleanly with zero errors.
