# Admin design audit and repair — 2026-10-24

Scope: shared admin shell, overview, statistics cards, editor panels, and automation status. Existing screenshot captures were reviewed as historical evidence. New desktop/mobile captures render the actual React components with explicitly synthetic fixture data; they do not authenticate against production or verify live data.

## Findings

| Pillar | Before / 4 | Issue | Repair |
| --- | --- | --- | --- |
| Copy | 2 | OS/version slogans, promotional badges, inflated automation labels | Plain section and action names; remove promotional chrome |
| Visuals | 2 | Moving nav links, gradients, accent stripes, floating/lifting cards | Flat surfaces, restrained borders, stable controls |
| Color | 2 | Fixed cream journal colors inside theme-aware admin | Semantic surface/content/status tokens for automation |
| Typography | 2 | Tiny mono labels competing with serif headings and duplicate metric labels | Readable UI labels, consistent heading hierarchy, monospace reserved for data |
| Spacing | 2 | Wide rail, loosely related panels, mismatched action heights | Narrower rail, consistent page rhythm and action sizes |
| Experience | 2 | Fully expanded navigation and heavy widgets; weak mobile panel wrapping | Collapse secondary groups by default, preserve access and preferences; responsive panels |

Implementation preserves the warm editorial palette and Bengali content typography. Public-site design is outside scope. No new feature badges, gradients, or dependencies.

## Verification and limits

- Reproducible fixture renderer: `scripts/admin-design-preview.tsx`. Generate CSS with `npx tailwindcss -i src/app/globals.css -o screenshots/admin-design/preview.css --minify`, then run `npx tsx scripts/admin-design-preview.tsx`.
- Actual components are rendered without hydration using synthetic content and fallback fonts. Screenshots cover overview, editor and automation in cream/night themes at 1440px and 390px. The script rejects page overflow and primary-action text contrast below 4.5:1. This is a layout check, not live authentication or end-to-end interaction testing.
- Shared `cn()` previously mistook `text-step-*` and `text-bengali-*` for color utilities. Defining their font-size class group restores foreground colors without per-button patches. The regression test failed before the fix and passes afterward.
- Editor source/timeline labels now use existing dictionary keys; draft saves are labeled Save Draft. Destructive icon controls and widget controls have accessible names.
- Review identified a mobile drawer/sidebar width mismatch; the mobile sidebar now fills its dialog.
- After repair: copy 3/4, visuals 3/4, color 3/4, typography 3/4, spacing 3/4, experience 3/4. Remaining follow-up: live authenticated checks of data-heavy screens, broader form-label accessibility, and actual-font cross-browser verification.
- Final validation: production build and lint pass; 45 suites / 300 tests pass. The existing rate-limiter interval still produces the Jest worker-exit warning. All 12 fixture viewport/theme checks pass.
