# Product Requirements Document (PRD) — Thoughts Whatever

## 1. Executive Summary
**Thoughts Whatever** is a premium, production-ready Bengali literature and documentary platform designed as a long-form cinematic companion to short-form social media content (specifically Instagram Reels). While short videos capture attention, this platform provides the comprehensive research, full essay, timelines, bibliography citations, audio narration, and multi-part documentary series behind every piece of content.

---

## 2. Target Audience
1. **Bengali Literature & History Enthusiasts**: Readers seeking deep, researched Bengali essays on figures like Tagore, Nazrul, Jibanananda, and historic events like the 1943 Bengal Famine.
2. **Social Media Followers**: Viewers coming from Instagram Reels wanting the complete text, original sources, and bibliography behind 60-second video clips.
3. **Diaspora Readers & Scholars**: Readers looking for clean typography, searchability, bookmarking, PDF/print features, and custom reading themes.

---

## 3. Core Features & Functional Requirements

### 3.1 Content Management & Editorial Engine
- **Multi-Kind Content Support**:
  - `RACHANA` (রচনা): Written companion to Instagram Reels.
  - `DOCUMENTARY` (ডকুমেন্টারি): Video-led deep dives with timeline events and academic sources.
  - `BLOG` (ব্লগ): Independent longform Bengali essays.
- **Rich Editorial Features**:
  - Timelines with custom year formatting (e.g. "১৯৪৭", "১৯৪৩–৪৪").
  - Cited Sources & Bibliography (তথ্যসূত্র) with URLs and notes.
  - Media Embeds (Instagram Reels, YouTube videos, and Audio narration mp3s).
  - Authors & Taxonomy Hubs (Rabinath, Nazrul, Jibanananda) with dedicated landing pages.
- **Admin CMS Editor**:
  - Custom Bengali rich text/markdown editor (`/admin/pieces`).
  - Auto-generated Bengali slugs (`/writing/পদ্মানদীর-মাঝি-নদীর-কাছে`).
  - Draft vs. Published status management with scheduling support.
  - CSV Bulk Content Import (`/admin/import`) for importing social media posts into draft essays.

### 3.2 Immersive Reader Experience
- **Cinematic Reading Modes**:
  - Cream paper (`var(--surface)`: #FDFBF5)
  - Sepia warm paper (#F4ECDC)
  - Night dark mode (#0D0D0E)
  - Archive mode (#0A0A0B) scoped to documentary pages.
- **Typographic Controls**:
  - Font size adjustment (16px base → 22px).
  - Reader line height & family controls.
  - True Bengali conjunct grapheme drop-caps (`dropCap` splitting grapheme clusters safely without slicing Bengali characters).
  - Poetry verse formatting (`pre.verse`) preserving line breaks.
- **Interactive Reader Tools**:
  - Reading progress bar fixed to viewport top.
  - Client-side LocalStorage Bookmarks system.
  - Print-friendly PDF CSS styling (`@media print`).
  - Interactive Quote Card generator (`QuoteCardPicker`).
  - Floating/Mini Audio Player for narration (`NarrationButton`).

### 3.3 Analytics & Intelligence
- **Privacy-First Analytics Engine**:
  - Session-based tracking without cookies or PII (`tracker.ts`).
  - Events tracked: `view`, `scroll_25`, `scroll_50`, `scroll_75`, `scroll_100`, `instagram_click`, `reel_click`.
- **Admin Insights Dashboard (`/admin`)**:
  - Real-time total views, unique visitors, reel link clicks, and newsletter subscriber counts.
  - Custom interactive daily trend chart (`trend-chart.tsx`).
  - Top performing content table sorted by views and engagement.
  - Multi-part series completion rate tracking (% of readers finishing from Ep 1 to Ep N).

### 3.4 Series & Multi-Part Documentaries
- **Dedicated Series Landing Pages (`/series/[slug]`)**:
  - Episode listing with part numbers, titles, and publication dates.
  - In-article previous/next episode navigation (`SeriesNav`).
- **Admin Series Manager (`/admin/series`)**:
  - Episode reordering with Move Up / Move Down controls.

### 3.5 Newsletter & SEO Optimization
- **Bengali Newsletter ("চিঠি")**:
  - Double opt-in newsletter signup forms embedded across site footer and articles.
  - Admin subscriber management (`/admin/subscribers`).
- **SEO & Discovery**:
  - Dynamic XML Sitemap (`/sitemap.xml`) with percent-encoded Bengali URLs.
  - RSS 2.0 Feed (`/rss.xml`).
  - Full-text Fuse.js search engine (`/search`).
  - Open Graph tags & structured JSON-LD schemas.

---

## 4. Non-Functional Requirements
- **Performance**: Lighthouse score 90+ across all metrics; Core Web Vitals LCP < 2.5s, FID < 100ms, CLS < 0.1.
- **Accessibility**: WCAG 2.2 AA compliance; keyboard navigation, skip-to-content links, screen-reader `.sr-only` support.
- **Bengali Typography Integrity**: Enforced `font-synthesis: none` to prevent browser distortion of Bengali conjuncts (যুক্তাক্ষর).
