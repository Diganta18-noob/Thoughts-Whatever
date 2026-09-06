# Thoughts Whatever — Visual Asset System

This document outlines the official 3-tier image asset hierarchy, aspect ratios, storage models, fallback behavior, and production guidelines for `https://thoughts-whatever.vercel.app/`.

---

## 1. The 3-Tier Asset Hierarchy

| Tier | Asset Type | Database Field | Ratio | Target Resolution | Key Placements & Consumers |
|---|---|---|---|---|---|
| **Tier 1** | **Poster / Identity** | `coverImage` | **9:16** | 1080×1920px (min 941×1672px) | Series index cards, FeaturedSeriesHero portrait card, article reader split hero, social OpenGraph sharing, reels voiceover companion |
| **Tier 2** | **Episode Thumbnail** | `thumbnailImage` | **16:9** | 1920×1080px (min 1280×720px) | Homepage `LatestEpisodes` 4-card grid, `SupportingEditorialItem` secondary cards, archive cards, related essays, search result cards |
| **Tier 3** | **Series Key Art** | `bannerImage` | **21:9** | 2520×1080px (or 1920×823px) | Series detail page (`/series/[slug]`) full-width cinematic hero header |

---

## 2. Non-Breaking Fallback Architecture

To ensure existing pieces and series without dedicated landscape art render reliably without visual degradation or layout shifts, the image utility layer implements a strict fallback chain:

```
thumbnailImage (16:9):
  1. piece.thumbnailImage (Dedicated 16:9 Cloudinary asset)
     ↓ (if null or empty)
  2. coverSrc("piece", slug, piece.coverImage) (9:16 poster cropped in aspect-[16/9] object-cover container)
     ↓ (if missing or error)
  3. /api/cover/piece/[slug] fallback placeholder

bannerImage (21:9):
  1. series.bannerImage (Dedicated 21:9 Cloudinary key art)
     ↓ (if null or empty)
  2. coverSrc("series", slug, series.coverImage) (9:16 poster cropped in aspect-[16/9] / aspect-[21/9] container)
     ↓ (if missing or error)
  3. /api/cover/series/[slug] fallback placeholder

coverImage (9:16):
  1. coverSrc("piece"|"series", slug, coverImage)
     ↓
  2. /api/cover placeholder
```

Every piece or series uploaded prior to this system functions seamlessly using its `coverImage`. Newly uploaded `thumbnailImage` and `bannerImage` assets are purely additive and automatically upgrade the presentation.

---

## 3. Storage & Filename Conventions

### Local Content Directories
- **Portrait Covers / Posters (9:16):**
  `Content/Thumnail/[Series or Category]/`
- **Landscape Thumbnails & Banners (16:9 & 21:9):**
  `Content/Thumnail Landscape/[Series or Category]/`

### Standard Production Filename Format
```text
[series-slug]-poster-9x16.webp
[series-slug]-[episode-N]-thumbnail-16x9.webp
[series-slug]-banner-21x9.webp
```

For Bengali content folders:
- Landscape episode cards: `[Series Name] [পর্ব নম্বর] - Landscape.png` (e.g., `আনন্দমঠ 1 - Landscape.png`)
- Landscape solo works: `[Piece Title] - Landscape.png` (e.g., `চিত্ত যেথা ভয় শুন্য - Landscape.png`)

---

## 4. Editorial Composition Guidelines

### Episode Cards (`thumbnailImage` - 16:9)
- **Primary Focus:** Prominent central character or symbolic object occupying 45–60% of the frame height.
- **Composition:** Asymmetric rule-of-thirds or strong center framing with uncluttered negative space.
- **Typography:** Minimal text. Avoid long quotes or subheads that become unreadable on mobile screens (under 360px width).
- **Contrast:** High tonal contrast between subject and background to maintain legibility when scaled down.

### Series Key Art (`bannerImage` - 21:9)
- **Cinematic Horizon:** Ultra-wide composition designed for full-width desktop viewports.
- **Subject Placement:** Position key subjects towards the right or center-right so the overlaid Bengali title, episode count pill, and CTA button remain legible on the dark left gradient overlay.
- **Atmosphere:** Deep atmospheric lighting (fog, rain, shadows, warm oil lamps) fitting the historical Bengali literary aesthetic.

---

## 5. API & Code Integration Reference

### Utility Methods (`src/lib/images.ts`)
```typescript
import { thumbnailSrc, bannerSrc, coverSrc } from "@/lib/images";

// Resolves 16:9 thumbnail with fallback
const thumbUrl = thumbnailSrc(piece.slug, piece.thumbnailImage, piece.coverImage);

// Resolves 21:9 banner with fallback
const bannerUrl = bannerSrc(series.slug, series.bannerImage, series.coverImage);
```

### Components
- `<CoverImageFrame aspect="aspect-[16/9]" ... />`: Standard wrapper for responsive card images.
- `<SeriesHeroBanner ... />`: Full-width cinematic hero header on `/series/[slug]`.
