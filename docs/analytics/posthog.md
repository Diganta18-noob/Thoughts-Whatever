# PostHog Analytics Integration — Thoughts Whatever

## 1. Installation
The following official PostHog packages were installed:
- `posthog-js`: Client-side SDK (browser event tracking, session replay, autocapture)
- `posthog-node`: Server-side Node.js SDK (API routes, auth events, server component event capture)

## 2. Environment Variables
Add the following variables to `.env` (development) and Vercel Environment Variables (production):

```env
# ─── PostHog Analytics ──────────────────────────────────────
NEXT_PUBLIC_POSTHOG_KEY="phc_sSSXcmT8r3M7ukkk5XiMBM9txvxQQWsbFGA5h3pexgW4"
NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"
```

> **Note**: `NEXT_PUBLIC_POSTHOG_KEY` is a public client token designed for browser libraries. Never commit secret tokens (`phx_...`).

## 3. Architecture
PostHog is integrated natively into Next.js 14 App Router without converting Server Components into Client Components:

1. **Reverse Proxying**: In `next.config.js`, all `/ingest/*` traffic is proxied directly to `us.i.posthog.com`. This bypasses ad-blocker restrictions and prevents third-party CORS issues.
2. **Provider Wrapping**: `<PostHogProvider>` wraps `<AppProviders>` in `src/components/providers/posthog-provider.tsx`. Client-side initialization happens once on initial load (`posthog-client.ts`).
3. **Automated Route Tracking**: `PostHogPageViewTracker` monitors Next.js App Router route transitions via `usePathname` and `useSearchParams` inside a `<Suspense>` boundary.
4. **Coexistence**: PostHog runs in parallel with the existing Prisma database analytics. The local Prisma table keeps powering the admin dashboard counts without disruption.

## 4. Event Taxonomy & Property Dictionary

See full dictionary in [EVENTS.md](file:///d:/Antigravity/thoughts-whatever/docs/analytics/EVENTS.md).

| Event Name | Trigger Location | Mandatory Properties |
|---|---|---|
| `$pageview` | Route navigation | `pathname`, `$current_url`, `content_type`, `theme`, `locale` |
| `documentary_opened` | Documentary page view | `piece_id`, `slug`, `content_type`, `title_bn`, `series_id` |
| `article_opened` | Rachana / Article view | `piece_id`, `slug`, `content_type`, `title_bn`, `reading_time_estimate` |
| `episode_opened` | Series episode view | `piece_id`, `slug`, `series_id`, `series_name`, `series_order` |
| `reading_progress` | Scroll depth milestones | `piece_id`, `slug`, `progress_percentage` (25, 50, 75, 90, 100) |
| `episode_completed` | Reached 100% scroll | `piece_id`, `slug`, `content_type` |
| `series_opened` | Series detail page view | `series_id`, `series_name`, `total_episodes` |
| `previous_episode_clicked` | Series navigator | `series_slug`, `from_episode_order`, `to_slug`, `to_order` |
| `next_episode_clicked` | Series navigator | `series_slug`, `from_episode_order`, `to_slug`, `to_order` |
| `bookmark_clicked` | Bookmark button toggle | `slug`, `content_type`, `action` ("add" \| "remove") |
| `reel_clicked` | Instagram reel CTA click | `piece_id`, `reel_url`, `placement`, `variant` |
| `search_performed` | Search query executed | `query`, `result_count`, `language` |
| `language_changed` | Locale toggle | `from_language`, `to_language` |
| `newsletter_started` | Form submission begin | `source` |
| `newsletter_subscribed` | Successful subscription | `source` (No email/PII) |
| `newsletter_failed` | Form submission fail | `source`, `code` |
| `admin_login_success` | Admin authentication | `role` ("admin") |

## 5. Dashboard Structure
In PostHog (`us.posthog.com`), create 5 dedicated dashboards:

1. **Thoughts Whatever Overview**: DAU/WAU/MAU, `$pageview` breakdown by `content_type`, Top Pages, Returning Readers.
2. **Documentary Performance**: `documentary_opened`, `episode_opened`, `episode_completed`, `reading_progress` funnel.
3. **Content Discovery**: `search_performed` queries, zero-result search rate, `next_episode_clicked` conversion.
4. **Engagement & Social**: `bookmark_clicked`, `reel_clicked` conversion, `newsletter_subscribed` vs `newsletter_failed`.
5. **Performance & Observability**: Page load time, JS errors, device / browser breakdown.

## 6. Session Replay & Privacy
Session Replay is active with strict masking enabled in `src/lib/posthog-client.ts`:
- `maskAllInputs: true`
- Password fields and sensitive administrative entries are completely masked.
- Email addresses and auth tokens are **never** included in event properties.

## 7. Feature Flags & Experiments
Feature flags can be checked anywhere in Client Components:
```ts
import { posthog } from "@/lib/posthog-client";

if (posthog.isFeatureEnabled("new_documentary_page")) {
  // Render new experimental layout
}
```

## 8. Testing & Troubleshooting
- **Local Dev**: Verify network requests in browser Developer Tools under `/ingest/e/`.
- **PostHog Live Events**: Open PostHog → Data Management → Events to confirm real-time event delivery.
