# Public website quality cleanup

The October 2026 cleanup preserves the existing homepage presentation and improves shared navigation, mobile layout, metadata, and reader feedback.

## Changes

- Desktop navigation begins at 1280px so tablet controls fit; the mobile menu scrolls in short viewports, closes on navigation and Escape, and restores keyboard focus.
- Footer columns begin at 1024px; long contact addresses wrap, search fields shrink, newsletter controls stack below 360px, and article tables scroll within their container.
- Homepage and 404 metadata are explicit. Reference titles avoid repeating the site name and reference pages declare their own canonical URLs.
- SVG and PNG favicons, a 180px Apple touch icon, and an actual default social sharing image are available.
- The newsletter desk image uses a 79,914-byte WebP instead of a 792,830-byte JPEG. Next Image continues to serve AVIF/WebP and now includes 320px, 375px, and 480px responsive sizes. The original image is retained as source material.
- Search failures have an error and retry action rather than showing zero matches. Newsletter success/error states are announced to assistive technology, and the loading submit button retains its accessible name.
- The contact newsletter card and footer site name link to their destinations. Copyright digits follow the selected interface language and the year remains automatic.
- The 404 recovery navigation points to reader pages and search. Existing valid navigation remains available.

No published phone number was found. Existing contact email links already use `mailto:`. No public lorem ipsum or “coming soon” copy was found; useful input hints remain.

## Verification

Completed: production build passed; 12 targeted tests passed; 48 literal internal link references resolved; 230 browser page/viewport checks passed with zero horizontal overflow, missing descriptions, unexpected statuses, or off-screen header controls. Menu Escape/navigation, newsletter success/error feedback, and search retry passed. Mobile contact and tablet homepage screenshots were visually reviewed.

- `npm run build`
- `npm test -- --runTestsByPath src/components/search/__tests__/use-search.test.tsx src/lib/__tests__/images.test.ts --cacheDirectory .next/jest-cache`
- `npx tsx scripts/audit-public-links.ts` checks literal internal link references against application routes and public files. It does not validate remote websites or database-provided links.
- `node scripts/check-public-mobile.cjs` checks public landing pages and prerendered article/author/series pages at 320, 375, 768, 1024, and 1440px. Set `MOBILE_AUDIT_URL` to the local preview address and optionally `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to an installed Chromium executable. It also verifies menu and newsletter feedback plus search retry using intercepted responses; no subscription is sent.
- Browser output is saved to `docs/qa/mobile-audit.json`, with representative screenshots beside it.

Authenticated admin workflows, private previews, external source availability, and every database reference edition are outside this public-page browser audit.
