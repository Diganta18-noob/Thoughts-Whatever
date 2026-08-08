# Event Taxonomy & Dictionary — Thoughts Whatever

## Standard Events

### `$pageview`
Automatically captured on route navigation in Next.js App Router.
- **Properties**:
  - `pathname` (string, e.g., `/documentary/meghnadbadh-kavya`)
  - `$current_url` (string, full URL)
  - `content_type` (string: `"home"` | `"documentary"` | `"series"` | `"rachana"` | `"blog"` | `"search"` | `"archive"` | `"admin"`)
  - `theme` (string: `"cream"` | `"sepia"` | `"night"`)
  - `locale` (string: `"en"` | `"bn"`)

---

## Content Analytics Events

### `documentary_opened`
Fired when a reader loads a documentary piece.
- **Properties**: `piece_id`, `slug`, `title_bn`, `series_id`, `series_name`, `series_order`, `reading_time_estimate`, `published_at`

### `article_opened`
Fired when an article / rachana piece is opened.
- **Properties**: `piece_id`, `slug`, `title_bn`, `reading_time_estimate`, `published_at`

### `episode_opened`
Fired when a series episode is opened.
- **Properties**: `piece_id`, `slug`, `title_bn`, `series_id`, `series_name`, `series_order`, `reading_time_estimate`

### `reading_progress`
Fired when scroll depth reaches milestones (25%, 50%, 75%, 90%, 100%).
- **Properties**: `piece_id`, `slug`, `content_type`, `progress_percentage`, `viewport_height`

### `episode_completed` / `article_completed`
Fired when scroll reaches 100%.
- **Properties**: `piece_id`, `slug`, `content_type`

---

## Series Analytics Events

### `series_opened`
Fired on series detail page (`/series/[slug]`).
- **Properties**: `series_id`, `series_name`, `total_episodes`

### `previous_episode_clicked`
Fired when clicking previous episode in `SeriesNavigator`.
- **Properties**: `series_slug`, `from_episode_order`, `to_slug`, `to_order`

### `next_episode_clicked`
Fired when clicking next episode in `SeriesNavigator`.
- **Properties**: `series_slug`, `from_episode_order`, `to_slug`, `to_order`

---

## Engagement Events

### `bookmark_clicked`
Fired when toggling "Later Read" bookmark.
- **Properties**: `slug`, `content_type`, `action` (`"add"` | `"remove"`)

### `reel_clicked`
Fired when clicking Instagram Reel CTA.
- **Properties**: `piece_id`, `reel_url`, `placement` (`"hero"` | `"inline"` | `"sidebar"`), `variant` (`"banner"` | `"card"` | `"button"`)

---

## Search Events

### `search_performed`
Fired after debounced typing in search dialog (≥2 characters).
- **Properties**: `query`, `result_count`, `language`

---

## Chrome & Preference Events

### `language_changed`
Fired when reader switches interface language between English and Bengali.
- **Properties**: `from_language`, `to_language`

---

## Newsletter Events

### `newsletter_started`
Fired on newsletter form submission start.
- **Properties**: `source`

### `newsletter_subscribed`
Fired on successful subscription.
- **Properties**: `source` (Explicitly excludes email address PII)

### `newsletter_failed`
Fired on failed subscription attempt.
- **Properties**: `source`, `code`
