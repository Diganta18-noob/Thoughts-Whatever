# Rules Document — AI & Development Boundaries

## 1. Core Principles & Coding Standards

### 1.1 Strict Bengali Typography Rules
1. **Never Allow Browser Font Synthesis**:
   - Browsers fake bold/italic by smearing glyphs when real weights are missing. On Bengali, this destroys conjuncts (যুক্তাক্ষর turn into unreadable blobs).
   - `font-synthesis: none` MUST be enforced on `:lang(bn)`, `.font-bengali`, and `.font-bengali-sans`.
2. **Proper Leading & Letter Spacing**:
   - Bengali characters require more vertical room than Latin due to ascenders, matras (মাত্রা), and descenders. Default `line-height` must be at least `1.9`.
   - Never apply `letter-spacing` (tracking) to Bengali prose; tracking visually detaches vowel signs (এ-কার, ি-কার, ু-কার) from their consonants.
3. **Safe Grapheme Cluster Splitting**:
   - Drop caps and text truncation must use Unicode grapheme cluster segmentation (e.g. `Intl.Segmenter` or regex matching grapheme clusters) instead of naive `.charAt(0)` or CSS `::first-letter`, which slices Bengali conjuncts in half.

### 1.2 Library & Dependency Boundaries
- **Allowed Libraries**:
  - React 18 / 19, Next.js 14 App Router, Prisma ORM, Tailwind CSS, Framer Motion, Fuse.js, Lucide Icons, Date-fns.
- **Forbidden Practices**:
  - Do NOT install heavy chart libraries (like Recharts) if a clean SVG component can be used for public/bundle footprint optimization.
  - Do NOT introduce automated social media API scrapers. Content is manually curated by the admin.
  - Do NOT wrap database read calls in client components; keep data fetching in React Server Components (`RSC`).

---

## 2. Error Handling & Stability Guidelines
1. **No Silent Error Masking**: Never resolve errors by swallowing exceptions with empty `catch` blocks or returning dummy fallbacks without logging.
2. **Traceback Justification**: Every code change during debugging must be justified by log output or empirical error evidence.
3. **Server-Side Zone Safety**: Datetime values in forms must be converted in the browser's local timezone to prevent UTC timezone shifts on server renders.
4. **Valid Slug Encoding**: Slugs are native Bengali strings; all sitemap URLs, internal links, and canonical tags must use URI encoding (`encodeURIComponent`) where required by web specifications.

---

## 3. Security & Data Integrity Rules
1. **Admin Authentication**: Admin routes (`/admin/*` and `/api/admin/*`) must be strictly protected via `requireAdmin()` check and HTTP-Only JWT cookies.
2. **Reader Privacy**: No reader accounts, password fields, or PII collection for public readers. Bookmarks and reading preferences MUST remain strictly client-side in `localStorage`.
3. **Database Mutations**: Never perform destructive database operations (`db push --force-reset` or `DROP TABLE`) without explicit developer confirmation.
