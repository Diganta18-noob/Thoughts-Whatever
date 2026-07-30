# API Inventory & Endpoint Mapping — Thoughts Whatever

## 1. Public API Endpoints

### 1.1 Ingest Analytics Event
- **Endpoint**: `POST /api/analytics/event`
- **Purpose**: Record client-side user interactions (views, scroll depth milestones, link clicks).
- **Request Body**:
  ```json
  {
    "pieceId": "clx...",
    "eventType": "view" | "scroll_25" | "scroll_50" | "scroll_75" | "scroll_100" | "instagram_click",
    "sessionId": "sess_...",
    "referrer": "https://...",
    "metadata": { "scrollDepth": 75 }
  }
  ```
- **Response**: `{ "ok": true }`
- **Database Action**: Creates `AnalyticsEvent` row; increments `Piece.viewCount` on `view` event.

### 1.2 Quote Card Image Renderer
- **Endpoint**: `GET /api/quote-card?text=উদ্ধৃতি`
- **Runtime**: Node.js (`runtime = "nodejs"`)
- **Purpose**: Render downloadable 1080×1350 4:5 PNG quote images for social media sharing.
- **Query Params**: `text` (string, max 240 chars)
- **Response**: Binary PNG Image Buffer (`image/png`)
- **Headers**: `Cache-Control: public, max-age=3600, s-maxage=31536000, immutable`

### 1.3 Client Search Index
- **Endpoint**: `GET /api/search-index`
- **Purpose**: Serve compact JSON index of all published pieces for Fuse.js client search.
- **Response**: Array of `{ slug, kind, titleBn, dekBn, excerptBn, publishedAt, authors, tags }`.

### 1.4 Newsletter Subscription
- **Endpoint**: `POST /api/subscribe`
- **Request Body**: `{ "email": "reader@example.com", "source": "home" }`
- **Response**: `{ "ok": true, "message": "..." }`
- **Database Action**: Creates row in `Subscriber` table with `confirmed: true`.

---

## 2. Admin API Endpoints (Protected by JWT Session Cookie)

### 2.1 Admin Authentication
- `POST /api/admin/login`: `{ email, password }` → Sets HTTP-Only JWT session cookie `tw_session`.
- `POST /api/admin/logout`: Clears `tw_session` cookie.

### 2.2 Admin Analytics Query
- `GET /api/admin/analytics?period=7d|30d|all`
- **Response**: Aggregated data structure containing `overview`, `dailyTrend`, `topArticles`, and `seriesAnalytics`.

### 2.3 Article Management
- `GET /api/admin/pieces`: Lists articles with status filters.
- `POST /api/admin/pieces`: Creates new piece.
- `PUT /api/admin/pieces/[id]`: Updates existing piece.
- `DELETE /api/admin/pieces/[id]`: Deletes piece.

### 2.4 Series & Episode Reordering
- `GET / POST /api/admin/series`: Manages series entities.
- `PUT /api/admin/series/[id]/reorder`: Accepts `{ episodeOrders: [{ pieceId, seriesOrder }] }` and batch-updates piece sequence inside PostgreSQL transaction (`prisma.$transaction`).

### 2.5 Bulk CSV Import
- `POST /api/admin/import`: Accepts `{ rows: [ { titleBn, bodyBn, kind, seriesTitle, ... } ] }`. Creates series on the fly and inserts pieces as `DRAFT` status.

### 2.6 System Settings & Backup
- `GET /api/admin/settings?export=true`: Generates downloadable JSON backup containing all database tables.
- `POST /api/admin/settings`: Processes `changePassword` or `addAdmin` actions.
