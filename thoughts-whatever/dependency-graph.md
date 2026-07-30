# Dependency Graph & Code Importance Analysis — Thoughts Whatever

## 1. System Module Dependency Graph

```
[ Root Layout (app/layout.tsx) ]
  ├── [ AppProviders (components/providers) ]
  │     ├── ThemeScript (head theme setter)
  │     ├── LanguageProvider (i18n context)
  │     ├── ReadingProvider (typography context)
  │     ├── BookmarksProvider (localStorage context)
  │     └── AudioProvider (narration audio state)
  └── [ PublicChrome (components/layout) ]
        ├── SiteHeader (nav & search trigger)
        └── SiteFooter (links & newsletter CTA)

[ Universal Article View (components/pieces/article-view.tsx) ]
  ├── [ ViewTracker (components/pieces/view-tracker.tsx) ] ──> [ tracker.ts ]
  ├── [ Prose (components/reader/prose.tsx) ] ──> [ markdown.ts & bengali.ts ]
  ├── [ ReadingProgress (components/reader/reading-progress.tsx) ]
  ├── [ BookmarkButton (components/reader/bookmark-button.tsx) ]
  ├── [ QuoteCardPicker (components/reader/quote-card-picker.tsx) ] ──> [ GET /api/quote-card ]
  ├── [ NarrationButton (components/audio/narration-button.tsx) ]
  ├── [ MediaEmbed (ReelEmbed / VideoEmbed) ]
  ├── [ Timeline & SourceList ]
  └── [ SeriesNav ] ──> [ pieces.ts ]

[ Admin Suite (app/admin/(dashboard)) ]
  ├── [ AnalyticsDashboard (components/admin/analytics-dashboard.tsx) ]
  │     ├── TrendChart (responsive SVG line chart)
  │     ├── TopArticlesTable
  │     └── StatsCard
  ├── [ PieceEditor (components/admin/piece-editor.tsx) ]
  │     └── Prose (Live typography preview)
  ├── [ SeriesManager (components/admin/series-manager.tsx) ]
  └── [ requireAdmin (lib/auth.ts) ] ──> [ prisma.ts & JWT Cookie ]
```

---

## 2. Core System Files (Do Not Modify Lightly)

| File Path | Impact Level | Reason & Risk |
|-----------|--------------|---------------|
| `src/lib/pieces.ts` | 🔴 CRITICAL | Central database fetch module for all public content pages. Any regression breaks site-wide rendering. |
| `src/lib/auth.ts` | 🔴 CRITICAL | Security foundation. Handles JWT cookie signing, verification, and admin route protection. |
| `src/app/globals.css` | 🔴 CRITICAL | Core visual engine. Contains HSL color variable tokens for all 4 reader themes and Bengali font rules. |
| `src/lib/bengali.ts` | 🟡 HIGH | Contains Bengali numeral conversion (`toBengaliNumber`), Bengali slugification (`bengaliSlug`), and date formatters. |
| `src/components/reader/prose.tsx` | 🟡 HIGH | Typography rendering component for prose, poetry verse blocks, drop caps, and HTML content. |
| `src/app/api/quote-card/route.tsx` | 🟡 HIGH | Node.js Satori image rendering route using TTF disk fonts for Bengali complex-script shaping. |
| `prisma/schema.prisma` | 🔴 CRITICAL | Database blueprint. Schema mutations require migration pushes to PostgreSQL database. |

---

## 3. High Impact Risk Areas
1. **Bengali Font Synthesis**: Modifying `font-synthesis: none` rules in `globals.css` will cause browsers to shear/smear missing bold fonts, destroying Bengali conjuncts (যুক্তাক্ষর).
2. **Date Timezone Conversions**: Editing date input logic in `piece-editor.tsx` without preserving client-side local wall-clock conversion will shift publication dates by UTC offsets.
3. **Database Selection Offsets**: Select clauses in `pieces.ts` (`cardSelect`) deliberately exclude `bodyBn` to prevent fetching megabytes of prose text on index listings. Adding `bodyBn` to list queries will degrade database and page load performance.
