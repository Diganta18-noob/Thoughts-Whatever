# Complete Routes Intelligence — Thoughts Whatever

## 1. Public Web Routes

| Route Pattern | Rendering Strategy | Key File Path | Description & Auth Required |
|---------------|-------------------|---------------|-----------------------------|
| `/` | ISR (300s) | `src/app/page.tsx` | Magazine-style homepage. Public. |
| `/writing` | ISR (300s) | `src/app/writing/page.tsx` | Complete index of written companion essays. Public. |
| `/writing/[slug]` | SSG / ISR | `src/app/writing/[slug]/page.tsx` | Universal essay reading page. Public. |
| `/documentary` | ISR (300s) | `src/app/documentary/page.tsx` | Documentary listing page with dark archive layout. Public. |
| `/documentary/[slug]` | SSG / ISR | `src/app/documentary/[slug]/page.tsx` | Research documentary reading page (video, sources, timeline). Public. |
| `/blog` | ISR (300s) | `src/app/blog/page.tsx` | Longform blog posts listing. Public. |
| `/blog/[slug]` | SSG / ISR | `src/app/blog/[slug]/page.tsx` | Longform blog post reading page. Public. |
| `/series` | ISR (300s) | `src/app/series/page.tsx` | All multi-part documentary series index. Public. |
| `/series/[slug]` | SSG / ISR | `src/app/series/[slug]/page.tsx` | Series landing page with ordered episode list. Public. |
| `/authors` | ISR (300s) | `src/app/authors/page.tsx` | Literary figures hub index (Tagore, Nazrul, etc.). Public. |
| `/authors/[slug]` | SSG / ISR | `src/app/authors/[slug]/page.tsx` | Author hub page listing all associated works. Public. |
| `/archive` | Dynamic | `src/app/archive/page.tsx` | Interactive multi-faceted archive filter route. Public. |
| `/search` | Static | `src/app/search/page.tsx` | Client-side Fuse.js search page. Public. |
| `/bookmarks` | Static | `src/app/bookmarks/page.tsx` | Client-side reading list saved in `localStorage`. Public. |
| `/letter` | Static | `src/app/letter/page.tsx` | Newsletter subscription landing page. Public. |
| `/letter/unsubscribe` | Dynamic | `src/app/letter/unsubscribe/page.tsx` | Unsubscribe token confirmation handler. Public. |
| `/about` | Static | `src/app/about/page.tsx` | About the publication & editorial philosophy. Public. |
| `/sitemap.xml` | Dynamic / Hourly | `src/app/sitemap.ts` | Dynamic XML sitemap with percent-encoded Bengali URLs. Public. |
| `/rss.xml` | Dynamic | `src/app/rss.xml/route.ts` | RSS 2.0 feed generator. Public. |
| `/robots.txt` | Static | `src/app/robots.ts` | Crawler rules generator. Public. |

---

## 2. Admin Dashboard Protected Routes

| Route Pattern | Rendering Strategy | Key File Path | Auth Guard Required |
|---------------|-------------------|---------------|---------------------|
| `/admin/login` | Dynamic | `src/app/admin/login/page.tsx` | Admin Login Page (Public/Guest) |
| `/admin/analytics` | Dynamic | `src/app/admin/(dashboard)/analytics/page.tsx` | Advanced analytics, daily trend & CSV export. Admin Only. |
| `/admin/engagement` | Dynamic | `src/app/admin/(dashboard)/engagement/page.tsx` | Reading depth curves & completion funnel. Admin Only. |
| `/admin/geography` | Dynamic | `src/app/admin/(dashboard)/geography/page.tsx` | Geographic audience distribution & regional hubs. Admin Only. |
| `/admin/goals` | Dynamic | `src/app/admin/(dashboard)/goals/page.tsx` | Editorial targets & KPI tracking. Admin Only. |
| `/admin/activity` | Dynamic | `src/app/admin/(dashboard)/activity/page.tsx` | Real-time live activity stream. Admin Only. |
| `/admin/notifications` | Dynamic | `src/app/admin/(dashboard)/notifications/page.tsx` | Operational alerts & notification center. Admin Only. |
| `/admin/team` | Dynamic | `src/app/admin/(dashboard)/team/page.tsx` | Team, RBAC roles & permission matrix. Admin Only. |
| `/admin/security` | Dynamic | `src/app/admin/(dashboard)/security/page.tsx` | Security health & session revocation center. Admin Only. |
| `/admin/pieces` | Dynamic | `src/app/admin/(dashboard)/pieces/page.tsx` | Articles list table (Drafts/Published/Archived). Admin Only. |
| `/admin/pieces/new` | Dynamic | `src/app/admin/(dashboard)/pieces/new/page.tsx` | Create new article editor page. Admin Only. |
| `/admin/pieces/[id]` | Dynamic | `src/app/admin/(dashboard)/pieces/[id]/page.tsx` | Edit existing article editor page. Admin Only. |
| `/admin/pieces/[id]/history` | Dynamic | `src/app/admin/(dashboard)/pieces/[id]/history/page.tsx` | Article revisions, version control & visual diff. Admin Only. |
| `/admin/media` | Dynamic | `src/app/admin/(dashboard)/media/page.tsx` | Media library with usage tracking. Admin Only. |
| `/admin/content-health` | Dynamic | `src/app/admin/(dashboard)/content-health/page.tsx` | Content health scoring & recommendations. Admin Only. |
| `/admin/seo` | Dynamic | `src/app/admin/(dashboard)/seo/page.tsx` | SEO score & broken link scanner. Admin Only. |
| `/preview/[token]` | Dynamic | `src/app/preview/[token]/page.tsx` | Secure staging preview for review. Non-indexed. |
| `/admin/series` | Dynamic | `src/app/admin/(dashboard)/series/page.tsx` | Series episode reordering manager. Admin Only. |
| `/admin/taxonomy` | Dynamic | `src/app/admin/(dashboard)/taxonomy/page.tsx` | Authors, tags, and categories CRUD manager. Admin Only. |
| `/admin/subscribers` | Dynamic | `src/app/admin/(dashboard)/subscribers/page.tsx` | Newsletter subscribers list & statistics. Admin Only. |
| `/admin/import` | Dynamic | `src/app/admin/(dashboard)/import/page.tsx` | CSV bulk article migration tool. Admin Only. |
| `/admin/settings` | Dynamic | `src/app/admin/(dashboard)/settings/page.tsx` | Password change, new admin creation, JSON backup export. Admin Only. |

---

## 3. Server API Routes (`/api`)

| Route Pattern | HTTP Method | File Path | Auth Guard Required |
|---------------|-------------|-----------|---------------------|
| `/api/analytics/event` | POST | `src/app/api/analytics/event/route.ts` | Public (Rate-limited beacon) |
| `/api/quote-card` | GET | `src/app/api/quote-card/route.tsx` | Public (Cached image) |
| `/api/search-index` | GET | `src/app/api/search-index/route.ts` | Public |
| `/api/subscribe` | POST | `src/app/api/subscribe/route.ts` | Public |
| `/api/unsubscribe` | POST | `src/app/api/unsubscribe/route.ts` | Public |
| `/api/admin/login` | POST | `src/app/api/admin/login/route.ts` | Public |
| `/api/admin/logout` | POST | `src/app/api/admin/logout/route.ts` | Admin Only |
| `/api/admin/activity` | GET | `src/app/api/admin/activity/route.ts` | Admin Only |
| `/api/admin/notifications` | GET / PUT / POST / DELETE | `src/app/api/admin/notifications/route.ts` | Admin Only |
| `/api/admin/search` | GET | `src/app/api/admin/search/route.ts` | Admin Only |
| `/api/admin/team` | GET / POST / PUT / DELETE | `src/app/api/admin/team/route.ts` | Admin Only (RBAC checked) |
| `/api/admin/security` | GET / DELETE | `src/app/api/admin/security/route.ts` | Admin Only (RBAC checked) |
| `/api/admin/analytics` | GET | `src/app/api/admin/analytics/route.ts` | Admin Only |
| `/api/admin/pieces` | GET / POST | `src/app/api/admin/pieces/route.ts` | Admin Only |
| `/api/admin/pieces/[id]` | GET / PUT / DELETE | `src/app/api/admin/pieces/[id]/route.ts` | Admin Only |
| `/api/admin/series` | GET / POST | `src/app/api/admin/series/route.ts` | Admin Only |
| `/api/admin/series/[id]` | PUT / DELETE | `src/app/api/admin/series/[id]/route.ts` | Admin Only |
| `/api/admin/series/[id]/reorder` | PUT | `src/app/api/admin/series/[id]/reorder/route.ts` | Admin Only |
| `/api/admin/authors` | GET / POST | `src/app/api/admin/authors/route.ts` | Admin Only |
| `/api/admin/authors/[id]` | PUT / DELETE | `src/app/api/admin/authors/[id]/route.ts` | Admin Only |
| `/api/admin/tags` | GET / POST | `src/app/api/admin/tags/route.ts` | Admin Only |
| `/api/admin/tags/[id]` | PUT / DELETE | `src/app/api/admin/tags/[id]/route.ts` | Admin Only |
| `/api/admin/subscribers` | GET / DELETE | `src/app/api/admin/subscribers/route.ts` | Admin Only |
| `/api/admin/import` | POST | `src/app/api/admin/import/route.ts` | Admin Only |
| `/api/admin/settings` | GET / POST | `src/app/api/admin/settings/route.ts` | Admin Only |
