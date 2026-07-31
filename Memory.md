# Master Memory & Project Intelligence — Thoughts Whatever

## 1. Project Overview
**Thoughts Whatever** is a specialized, production-ready Bengali literature, long-form essay, and documentary publication platform built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **PostgreSQL (via Prisma ORM)**. 

It serves as an analytical companion to short-form social media reels (primarily Instagram Reels), expanding 60-second video previews into comprehensive, cited, interactive longform essays with audio narration, historical timeline events, citations, typography customization, and analytical series tracking.

---

## 2. Business Purpose & Problem Solved
- **Problem**: Short-form videos on Instagram and YouTube capture attention but lack the physical space for complete literary text, citations, bibliographies, historical chronologies, and deep contextual analysis.
- **Solution**: A digital publication that acts as the single source of truth for all research. Readers coming from social media reels can read the complete Bengali essay, inspect cited source materials, listen to voiceover narration, explore historical timelines, bookmark articles, and save high-resolution printable quote cards for social sharing.
- **Target Users**: Bengali literature enthusiasts, diaspora readers, history researchers, students, and social media followers seeking deep cultural content.

---

## 3. Technology Stack Breakdown
- **Frontend Framework**: Next.js 14.2 (App Router) + React 18
- **Language**: TypeScript 5 (Strict Mode)
- **Styling**: Tailwind CSS 3.4 + `tailwindcss-animate`
- **Database & ORM**: PostgreSQL (hosted on Neon Database) + Prisma ORM 6.9
- **Typography & Font Shaping**: `@next/font/google` (`Noto_Serif_Bengali`, `Hind_Siliguri`, `Galada`, `Fraunces`, `Inter`, `JetBrains_Mono`) + Satori (`next/og`) with native TTF files for complex-script Bengali shaping
- **Search Engine**: Fuse.js client-side fuzzy search over `/api/search-index` JSON
- **Authentication**: Custom HTTP-Only signed JWT cookies (`jsonwebtoken` + `bcryptjs`)
- **State Management**: React 18 Context API (`AppProviders`, `LanguageProvider`, `ReadingProvider`, `BookmarksProvider`, `AudioProvider`) + `localStorage` / `sessionStorage`
- **Analytics**: Zero-PII session tracking engine using `navigator.sendBeacon` and Prisma aggregations

---

## 4. Repository Structure
```
thoughts-whatever/
├── prisma/
│   ├── schema.prisma              # PostgreSQL database models & indexes
│   └── seed.ts                    # Production-grade seed data (Tagore, Nazrul, Famine docs)
├── scripts/
│   └── hash-password.ts           # Admin account CLI creation/update utility
├── src/
│   ├── app/                       # App Router routes & API endpoints
│   │   ├── (dashboard)/           # Protected admin routes (/admin/*)
│   │   ├── api/                   # Server API route handlers
│   │   ├── about/                 # About page
│   │   ├── archive/               # Full archive search/filter route
│   │   ├── authors/               # Literary figure hub routes
│   │   ├── blog/                  # Longform blog routes
│   │   ├── bookmarks/             # Client reading list / bookmarks route
│   │   ├── documentary/           # Dark-mode documentary series routes
│   │   ├── letter/                # Newsletter subscription page & unsubscribe handler
│   │   ├── search/                # Client-side fuzzy search interface
│   │   ├── series/                # Multi-part series hub & detail routes
│   │   ├── writing/               # Written essay companion routes
│   │   ├── error.tsx              # Error boundary component
│   │   ├── globals.css            # Reading theme custom variables & typography rules
│   │   ├── layout.tsx             # Root layout with font variable injections
│   │   ├── not-found.tsx          # 404 page with navigation links
│   │   ├── page.tsx               # Homepage magazine layout
│   │   ├── robots.ts              # Robots.txt generator
│   │   └── sitemap.ts             # Dynamic XML sitemap generator
│   ├── assets/
│   │   └── fonts/                 # TrueType Bengali fonts (Noto Serif Bengali TTFs)
│   ├── components/
│   │   ├── admin/                 # Admin analytics, editor, series, taxonomy components
│   │   ├── audio/                 # Narration button & mini audio player
│   │   ├── i18n/                  # Language toggle & Bengali number/date formatters
│   │   ├── layout/                # Site header, footer, page headers, public chrome
│   │   ├── newsletter/            # Subscriber CTA forms
│   │   ├── pieces/                # Article view, cards, embeds, timelines, sources
│   │   ├── providers/             # Global React Context providers
│   │   └── reader/                # Bengali prose renderer, dropcap, quote picker
│   └── lib/
│       ├── analytics.ts           # Analytics aggregation & database query logic
│       ├── admin-api.ts           # Client-side fetch helpers for admin API
│       ├── admin-pieces.ts        # Admin piece state transformations
│       ├── auth.ts                # JWT authentication signing & validation
│       ├── bengali.ts             # Bengali numerals, dates, word counts, slugifier
│       ├── i18n/                  # Translation dictionaries (en, bn)
│       ├── markdown.ts            # Markdown parser & heading extraction
│       ├── nav.ts                 # Navigation routes & kind metadata
│       ├── pieces.ts              # Central database read layer for public content
│       ├── prisma.ts              # Singleton PrismaClient instance
│       ├── seo.tsx                # Open Graph & JSON-LD generators
│       ├── tracker.ts             # Client-side privacy-first analytics tracker
│       ├── utils.ts               # Classnames joiner & site config
│       └── validation.ts          # Zod validation schemas for pieces/authors/tags
├── PRD.md                         # Product Requirements Document
├── Architecture.md                # System Architecture & Component Mapping
├── Rules.md                       # AI Boundaries & Bengali Typography Rules
├── Phases.md                      # Roadmap & Implementation Milestones
├── Design.md                      # Theme Tokens, Fonts & CSS System
└── Memory.md                      # Master Intelligence File
```

---

## 5. System Architecture
The application follows a modern Server-Driven Hybrid Architecture:
- **Public Content**: Delivered via React Server Components (RSC) with Incremental Static Regeneration (ISR `revalidate = 300`).
- **Reader Controls**: Interactive client widgets (Bookmarks, Reading Progress, Audio Player, Theme Switcher, Quote Card Picker) hydrated over static content.
- **Admin System**: Server-side JWT cookie validation via middleware/guard functions, serving dynamic client editor forms and analytics dashboards.
- **Image Generation Engine**: Node.js runtime endpoint (`/api/quote-card`) using `ImageResponse` (Satori) and disk-buffered TrueType Bengali fonts to render 1080×1350 quote images with exact complex-script shaping.

---

## 6. Routing Map Overview
- **Public Routes**: `/`, `/writing`, `/writing/[slug]`, `/documentary`, `/documentary/[slug]`, `/blog`, `/blog/[slug]`, `/series`, `/series/[slug]`, `/authors`, `/authors/[slug]`, `/archive`, `/search`, `/bookmarks`, `/letter`, `/letter/unsubscribe`, `/about`, `/sitemap.xml`, `/rss.xml`, `/robots.txt`.
- **Admin Dashboard Routes**: `/admin/login`, `/admin` (Overview & Analytics), `/admin/pieces`, `/admin/pieces/new`, `/admin/pieces/[id]`, `/admin/series`, `/admin/taxonomy`, `/admin/subscribers`, `/admin/import`, `/admin/settings`.
- **API Endpoints**: `/api/analytics/event`, `/api/quote-card`, `/api/search-index`, `/api/subscribe`, `/api/unsubscribe`, `/api/admin/*`.

---

## 7. Frontend Architecture & State Management
- **Themes**: CSS custom properties defined in `globals.css` (`cream`, `sepia`, `night`, `archive`). Injected pre-paint by `ThemeScript` to eliminate light-theme flashing.
- **Global Context Providers**:
  - `LanguageProvider`: Toggles interface language between English and Bengali (`en`/`bn`).
  - `ReadingProvider`: Manages adjustable typography (font size, line height, font family).
  - `BookmarksProvider`: Manages saved pieces stored in `localStorage`.
  - `AudioProvider`: Manages playback state of narration audio across page transitions.
- **Prose Renderer (`Prose.tsx`)**: Custom Markdown renderer built with `react-markdown`, `remark-gfm`, and `rehype-raw`. Implements complex Bengali poetry verse blocks (`pre.verse`) and Unicode grapheme cluster dropcaps (`Intl.Segmenter`).

---

## 8. Backend Architecture & Authentication Flow
- **Authentication**: JWT payload `{ sub: adminId, email: adminEmail }` stored in an `httpOnly`, `sameSite: lax`, `secure` cookie named `tw_session`.
- **Admin Protection Guard**: `requireAdmin()` inspects incoming cookies, verifies JWT against `process.env.AUTH_SECRET`, and fetches current admin user record from database.
- **Database Access**: Direct Prisma ORM queries executed inside Server Components and API Route Handlers.

---

## 9. Database Architecture (Entity Overview)
- **`Piece`**: Central model storing title, subtitle, dek (intro), body markdown, kind (`RACHANA`, `DOCUMENTARY`, `BLOG`), status (`DRAFT`, `PUBLISHED`), media links, reading time, view count, and relations.
- **`Series`**: Multi-part documentary collection with title, description, cover image, and ordered child pieces (`seriesOrder`).
- **`Author`**: Literary figure entity (Tagore, Nazrul, Jibanananda) generating author hub pages.
- **`Tag`**: Taxonomy entity categorized by `FORM`, `THEME`, `ERA`, or `TOPIC`.
- **`Source`**: Academic citation / bibliography item belonging to a `Piece`.
- **`TimelineEvent`**: Chronological historical event belonging to a `Piece`.
- **`AnalyticsEvent`**: Session-based event tracking views, scroll milestones (25-100%), and Instagram clicks.
- **`Subscriber`**: Email newsletter subscriber list.
- **`AdminUser`**: Admin account entity.

---

## 10. API Inventory Overview
- `POST /api/analytics/event`: Ingests anonymous client reading events.
- `GET /api/quote-card`: Generates downloadable 4:5 1080×1350 PNG quote cards via Satori.
- `GET /api/search-index`: Generates searchable JSON payload of all published content.
- `POST /api/subscribe` / `POST /api/unsubscribe`: Manages newsletter subscriptions.
- `GET /api/admin/analytics`: Computes aggregated metrics, daily trends, and series completion rates.
- `POST /api/admin/import`: Parses and batch-imports CSV essays as draft pieces.
- `PUT /api/admin/series/[id]/reorder`: Updates episode ordering sequence in a series.
- `GET/POST /api/admin/settings`: Handles admin password updates, new admin creation, and JSON backup exports.

---

## 11. Environment Variables & Security
- `DATABASE_URL`: PostgreSQL connection string (Neon pooler).
- `AUTH_SECRET`: Secret key used for signing session JWT tokens.
- `NEXT_PUBLIC_SITE_URL`: Base site URL (`http://localhost:3000` or production domain).
- `NEXT_PUBLIC_SITE_NAME`: Site name ("Thoughts Whatever").
- `NEXT_PUBLIC_INSTAGRAM`: Official Instagram profile URL.

---

## 12. Technical Debt & Future Recommendations
1. **Automated Error Monitoring**: Integrate Sentry for client/server runtime error capturing in production.
2. **Image Optimization Service**: Connect an external bucket (Cloudinary or Supabase Storage) for admin image uploads instead of static URL references.
3. **Database Indexing**: Maintain composite indexes on `AnalyticsEvent(pieceId, eventType, createdAt)` as event volume scales.
