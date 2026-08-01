# Brand Guidelines — Thoughts Whatever (t.w)

## Overview
The "t.w" logo identity system balances minimal modern typography with classical Bengali literary heritage.

---

## Logo System & Assets

### Assets Directory: `/public/brand/`
- **`logo-full.svg`**: Full brand mark with `t.w` serif title and `THOUGHTS.WHATEVER` subtitle.
- **`logo-compact.svg`**: Standalone `t.w` serif mark for site headers and small UI chrome.
- **`logo-icon.svg`**: Square rounded icon mark for favicons, touch icons, and social media avatars.

---

## React Component Usage

Use the `<Logo />` component from `@/components/brand/logo`:

```tsx
import { Logo } from "@/components/brand/logo";

// Header compact logo
<Logo variant="compact" showSubtitle={false} href="/" />

// Login or Hero full logo
<Logo variant="full" width={120} />

// Icon avatar
<Logo variant="icon" />
```

---

## Theme & Color Rules
- **Dark Mode**: Text color `#F7F4EF` (Cream white) on background `#141211`.
- **Light Mode**: Text color `#141211` (Rich graphite black) on background `#FDFBF5`.
- **Contrast Requirement**: Minimum 7:1 contrast ratio maintained across all variants.
