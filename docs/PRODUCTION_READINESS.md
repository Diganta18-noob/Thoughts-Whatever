# Production readiness — 7 October 2026

This update preserves the approved homepage and all media/caption data. No schema migration is required.

## Implemented

- Optional analytics requires acceptance, both in the PostHog adapter and the first-party event endpoint. Reject/accept buttons have equal visual weight. Footer settings allow withdrawal. DNT/GPC disables collection. Reference/content initial views also work when consent is granted mid-page.
- PostHog uses memory persistence with replay/autocapture disabled; query strings/search terms are stripped and admin events are excluded. First-party referrers use origin only. Existing events are not deleted on withdrawal.
- Privacy describes real storage, providers, newsletter confirmation and current retention. Terms documents reading/sharing and rights restrictions. The owner should review the wording and establish retention periods; this is not a claim of legal certification.
- PNG social preview replaces SVG previews. Existing SVG favicon remains. Terms and published Reference works are in sitemap; confirmation/tracking paths are excluded from robots. Reference catalogue canonical added.
- Trusted Vercel production HTTP requests redirect to HTTPS. Existing HSTS remains. Production CSP no longer allows eval or direct browser calls to AI services.
- Faint text contrast improved across themes (tested ratios 5.45–5.97:1). Night orange buttons use dark text (6.1:1 instead of white at 3.2:1); shared visible keyboard focus added. Newsletter adds error association, announcement, autocomplete and matching 254-character client/server limits. Existing server validation, honeypot and double opt-in retained. Rate-limit email keys now hash the full address; housekeeping timers no longer hold Node processes open.

## Verification

CI smoke checks public/legal/navigation destinations, missing-page recovery/noindex, consent persistence and withdrawal, mobile horizontal overflow, missing image alt attributes, PNG preview, and sitemap. It attaches a mobile screenshot and navigation timing report. Timings from CI are diagnostics, not real-user Core Web Vitals.

Existing Next Image AVIF/WebP compression, responsive sizes, cached CDN assets and reduced-motion/native scrolling are retained. Hero retains Latest Series as its single filled primary action; archive and resume links are secondary. No bulk content/media rewrites were made.

The public-environment regression test checks exposed identifiers against an allowlist. PostHog project key and site-verification identifiers are intentionally public; it is not a complete secret scan of Git history or production environment settings.

## Deployment/owner follow-up

1. Review privacy/terms and set an actual retention/deletion process. Existing database analytics has no automatic expiry.
2. Confirm HTTPS/domain configuration in Vercel and actual PostHog project variables. Consent is necessary even when PostHog is unconfigured because first-party analytics exists.
3. Newsletter IP/email limits are per instance in memory. Enable Vercel abuse controls or shared rate limiting if distributed spam appears; current honeypot and double opt-in are not a distributed traffic limiter.
4. Audit real published images for the quality of editorial alt text and content links. CI checks representative routes and missing attributes, not every historical/external URL.
5. After deployment, measure mobile LCP/INP/CLS with field data. CI navigation timings and responsive checks cannot certify all devices, accessibility, or production performance.

Optional analytics totals will decrease because readers can decline collection. No changes require paid services or new dependencies.
