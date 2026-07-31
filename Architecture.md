# System Architecture Document — Thoughts Whatever

## 1. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT BROWSER                                    |
|                                                                                   |
|  +--------------------+   +-----------------------+   +------------------------+  |
|  |  Public UI Chrome  |   |  Reader Controls      |   |  Admin Dashboard UI    |  |
|  |  (Header / Footer) |   |  (Bookmarks / Themes) |   |  (Editor / Analytics)  |  |
|  +---------+----------+   +-----------+-----------+   +-----------+------------+  |
+------------|--------------------------|---------------------------|---------------+
             |                          |                           |
             | HTTP GET (Page Render)   | Beacon / Fetch (Events)   | HTTP API / Auth Cookie
             v                          v                           v
+-----------------------------------------------------------------------------------+
|                               NEXT.JS 14 APP ROUTER                               |
|                                                                                   |
|  +--------------------+   +-----------------------+   +------------------------+  |
|  | Server Components  |   | Analytics Event API   |   | Protected Admin API    |  |
|  | (RSC + ISR 300s)   |   | (/api/analytics/event)|   | (/api/admin/*)         |  |
|  +---------+----------+   +-----------+-----------+   +-----------+------------+  |
|            |                          |                           |               |
|            | Satori font shaping      | Direct Event insert       | Auth Guard    |
|            v                          |                           v               |
|  +--------------------+               |               +------------------------+  |
|  | /api/quote-card    |               |               | requireAdmin() Guard   |  |
|  | (Node.js + TTF)    |               |               +-----------+------------+  |
|  +--------------------+               |                           |               |
+------------|--------------------------|---------------------------|---------------+
             |                          |                           |
             +--------------------------+---------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                                  PRISMA ORM                                       |
|                                                                                   |
|   Piece | Series | Author | Tag | Source | Timeline | AnalyticsEvent | AdminUser  |
+---------------------------------------+-------------------------------------------+
                                        |
                                        v
+-----------------------------------------------------------------------------------+
|                            POSTGRESQL DATABASE (NEON)                             |
+-----------------------------------------------------------------------------------+
```

---

## 2. Component Interaction & Flow Patterns

### 2.1 Public Reader Page Request Flow
1. **Client Request**: Browser requests `/writing/পদ্মানদীর-মাঝি-নদীর-কাঝে`.
2. **Server Render (RSC)**: Next.js executes `WritingArticlePage` Server Component.
3. **Data Layer (`pieces.ts`)**: Calls `getPieceBySlug()` using Prisma ORM with `status: "PUBLISHED"` check.
4. **HTML Stream**: Next.js streams pre-rendered HTML to client with font variables (`--font-bengali-serif`).
5. **Theme Ingestion (`ThemeScript`)**: Executes inline script in `<head>` before first paint to apply stored theme (`cream`, `sepia`, or `night`) without visual layout flash.
6. **Client Hydration**: Interactive widgets (`ReadingProgress`, `BookmarkButton`, `ViewTracker`, `NarrationButton`) hydrate on the client.
7. **Analytics Event**: `<ViewTracker />` fires `view` event to `/api/analytics/event` via `navigator.sendBeacon`.

### 2.2 Dynamic Quote Card Generation Flow
1. **User Action**: Reader selects a quote snippet in an article and clicks "Quote Card".
2. **Client Request**: Browser requests `/api/quote-card?text=উদ্ধৃতি`.
3. **Node Runtime Execution**: Executed in Node.js runtime (`export const runtime = "nodejs"`).
4. **TTF Font Buffer Loading**: `loadFonts()` reads TrueType Bengali fonts (`NotoSerifBengali-Regular.ttf` & `SemiBold.ttf`) from `src/assets/fonts/`.
5. **Satori Shaping & Render**: Satori renders React JSX into SVG, performing full Bengali complex-script shaping, then compiles into 1080×1350 PNG image via `ImageResponse`.
6. **HTTP Cache Response**: Returns image with `Cache-Control: public, max-age=3600, s-maxage=31536000, immutable`.

### 2.3 Analytics Aggregation Flow
1. **Client Ingestion**: User scrolls past 25%, 50%, 75%, 100% depth milestones.
2. **Beacon Dispatch**: `tracker.ts` sends anonymous payload `{ pieceId, eventType: "scroll_75", sessionId }` to `/api/analytics/event`.
3. **Database Store**: API route inserts record into `AnalyticsEvent` table.
4. **Admin Dashboard Query**: When admin views `/admin`, `getOverviewStats()`, `getDailyTrend()`, and `getSeriesAnalytics()` execute PostgreSQL aggregations to display charts and completion percentages.
