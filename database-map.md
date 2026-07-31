# Database Intelligence & Schema Mapping — Thoughts Whatever

## 1. Database Connection & Technology
- **Engine**: PostgreSQL 15+ (Hosted on Neon Database Serverless Pooler)
- **ORM**: Prisma ORM v6.9.0
- **Datasource URL**: Defined in `env("DATABASE_URL")` with `sslmode=require`

---

## 2. Entity Model Definitions

### 2.1 `Piece` (Central Content Entity)
- **Table**: `Piece`
- **Purpose**: Stores articles, documentaries, and blog posts.
- **Fields**:
  - `id`: String (cuid, Primary Key)
  - `kind`: PieceKind Enum (`RACHANA`, `BLOG`, `DOCUMENTARY`)
  - `status`: PieceStatus Enum (`DRAFT`, `PUBLISHED`, `ARCHIVED`)
  - `slug`: String (Unique)
  - `titleBn`: String
  - `titleEn`: String?
  - `subtitleBn`: String?
  - `dekBn`: String (Text, Intro line)
  - `bodyBn`: String (Text, Markdown prose)
  - `excerptBn`: String (Text)
  - `coverImage`: String?
  - `reelUrl`: String? (Instagram Reel link)
  - `videoUrl`: String? (YouTube link)
  - `audioUrl`: String? (Narration mp3 link)
  - `audioSec`: Int? (Audio duration in seconds)
  - `readingMinutes`: Int (Default: 1)
  - `featured`: Boolean (Default: false)
  - `viewCount`: Int (Default: 0)
  - `seoDescription`: String?
  - `ogImage`: String?
  - `publishedAt`: DateTime?
  - `createdAt` / `updatedAt`: DateTime
  - `seriesId`: String? (Foreign key → `Series.id`)
  - `seriesOrder`: Int? (Sequence number within series)
- **Indexes**:
  - `[kind, status, publishedAt]`
  - `[status, featured]`
  - `[seriesId, seriesOrder]`

### 2.2 `Series` (Multi-part Collections)
- **Table**: `Series`
- **Fields**:
  - `id`: String (Primary Key)
  - `slug`: String (Unique)
  - `titleBn`: String
  - `titleEn`: String?
  - `descBn`: String? (Text)
  - `coverImage`: String?
  - `createdAt` / `updatedAt`: DateTime
- **Relations**: `pieces` → Array of `Piece`

### 2.3 `Author` (Literary Figure Hub)
- **Table**: `Author`
- **Fields**: `id`, `slug` (Unique), `nameBn`, `nameEn`, `era` (e.g. "১৮৬১–১৯৪১"), `bioBn`, `portrait`, timestamps.
- **Relations**: `pieces` → Many-to-Many join table `_PieceAuthors`.

### 2.4 `Tag` (Taxonomy)
- **Table**: `Tag`
- **Fields**: `id`, `slug` (Unique), `labelBn`, `labelEn`, `kind` Enum (`FORM`, `THEME`, `ERA`, `TOPIC`).
- **Relations**: `pieces` → Many-to-Many join table `_PieceTags`.

### 2.5 `Source` (Citations)
- **Table**: `Source`
- **Fields**: `id`, `pieceId` (FK → `Piece.id` onDelete Cascade), `label`, `url`, `note`, `order`.
- **Index**: `[pieceId, order]`

### 2.6 `TimelineEvent` (Chronology)
- **Table**: `TimelineEvent`
- **Fields**: `id`, `pieceId` (FK → `Piece.id` onDelete Cascade), `year` (Text), `labelBn`, `descBn`, `order`.
- **Index**: `[pieceId, order]`

### 2.7 `AnalyticsEvent` (Telemetry)
- **Table**: `AnalyticsEvent`
- **Fields**: `id`, `pieceId` (FK → `Piece.id` onDelete SetNull), `eventType`, `sessionId`, `referrer`, `userAgent`, `metadata` (JSON), `createdAt`.
- **Indexes**:
  - `[pieceId, eventType, createdAt]`
  - `[sessionId, createdAt]`
  - `[createdAt]`

### 2.8 `Subscriber` (Newsletter)
- **Table**: `Subscriber`
- **Fields**: `id`, `email` (Unique), `nameBn`, `confirmed`, `unsubscribeToken` (Unique), `source`, `confirmedAt`, `unsubscribedAt`.

### 2.9 `AdminUser` (Admin Security)
- **Table**: `AdminUser`
- **Fields**: `id`, `email` (Unique), `passwordHash`, `nameBn`, `lastLoginAt`, `createdAt`.

---

## 3. Entity Relationships Diagram (ERD)

```
        +---------------+
        |    Series     |
        +-------+-------+
                | 1
                |
                | N
+---------------+---------------+          +------------------+
|             Piece             |--------->|  AnalyticsEvent  |
+-------+-------+-------+-------+ 1      N +------------------+
        | 1     | 1     | N
        |       |       |
        | N     | N     | N
+-------v---+ +-v-----+ +v--------------+
|  Source   | |Time-  | | _PieceAuthors |
| (Citation)| |  line | +-------+-------+
+-----------+ +-------+         |
                                v
                           +----+-----+
                           |  Author  |
                           +----------+
```
