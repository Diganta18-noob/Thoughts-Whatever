# Design System & Aesthetics — Thoughts Whatever

## 1. Color Palettes & Reading Themes

The platform supports **4 primary visual themes** controlled via CSS custom properties on `<html>` or `data-surface` wrappers:

```css
/* 1. Cream Paper (Default / Journal Surface) */
[data-theme="cream"] {
  --surface: 253 251 245;        /* #FDFBF5 */
  --surface-raised: 255 255 255; /* #FFFFFF */
  --content: 31 27 22;           /* #1F1B16 Warm Dark Ink */
  --content-soft: 74 66 56;      /* #4A4238 Muted Ink */
  --content-faint: 138 127 110;  /* #8A7F6E Faint Rule / Label */
  --rule: 222 213 194;           /* #DED5C2 Paper Border */
  --accent: 140 47 31;           /* #8C2F1F Vermilion Red */
}

/* 2. Sepia Vintage Paper */
[data-theme="sepia"] {
  --surface: 244 236 220;        /* #F4ECDC */
  --surface-raised: 250 244 232;
  --content: 44 34 22;
  --content-soft: 86 70 51;
  --content-faint: 145 126 99;
  --rule: 216 200 172;
  --accent: 143 68 32;
}

/* 3. Night Mode */
[data-theme="night"] {
  --surface: 13 13 14;          /* #0D0D0E Rich Charcoal */
  --surface-raised: 22 22 24;
  --content: 232 230 225;
  --content-soft: 165 162 155;
  --content-faint: 107 104 98;
  --rule: 43 43 47;
  --accent: 224 112 60;          /* Warm Ember Orange */
}

/* 4. Documentary Archive (Cinematic Surface) */
[data-surface="archive"] {
  --surface: 10 10 11;          /* #0A0A0B Void Black */
  --surface-raised: 19 19 21;
  --content: 232 230 225;
  --content-soft: 165 162 155;
  --content-faint: 107 104 98;
  --rule: 35 35 38;
  --accent: 193 68 14;
}
```

---

## 2. Typography Scale & Fonts

| Purpose | Font Family | Google Font / Fallbacks |
|---------|-------------|-------------------------|
| **Bengali Body Prose** | `font-bengali` | `Noto Serif Bengali` (`--font-bengali-serif`), SolaimanLipi, Kalpurush, Vrinda |
| **Bengali Interface / UI** | `font-bengali-sans` | `Hind Siliguri` (`--font-bengali-sans`), SolaimanLipi, Kalpurush |
| **Bengali Display / Brand** | `font-display` | `Galada` (`--font-bengali-display`), Noto Serif Bengali |
| **Latin Serif (Journal)** | `font-serif` | `Fraunces` (`--font-latin-serif`), Georgia |
| **Latin Sans (Interface)** | `font-sans` | `Inter` (`--font-latin-sans`), system-ui |
| **Monospace / Metadata** | `font-mono` | `JetBrains Mono` (`--font-mono`), ui-monospace |

### Typography Rules
- **Base Reader Measure**: `max-width: 38rem` (~62 Bengali characters per line for optimal reading comfort).
- **Prose Line Height**: Default `1.9` for Bengali text to prevent ascender/descender collisions.
- **Drop Caps**: Rendered using `.dropcap` floating single grapheme cluster in vermilion accent color.
- **Poetry / Verse**: Formatted with `.prose-bengali .verse` preserving explicit authorial linebreaks.

---

## 3. Visual Components & Polish
- **Glassmorphism Cards**: Subtly bordered, elevated surfaces with smooth hover transitions (`hover:border-accent/40`).
- **Typography Controls Bar**: Sticky/floating bar for adjusting font size (16px to 22px), line height, and reader theme.
- **Print Stylesheet (`@media print`)**: Hides UI chrome, navigation, embedded video/audio, and formats clear 11.5pt black-on-white text with printed URL footers.
