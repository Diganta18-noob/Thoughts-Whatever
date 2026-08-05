export type ImageOrientation = "portrait" | "landscape" | "square" | "ultra-wide";
export type EditorialLayout = "split" | "hero" | "card" | "banner";

export interface ImageMeta {
  width: number;
  height: number;
  aspectRatio: number;
  orientation: ImageOrientation;
  layout: EditorialLayout;
}

/**
 * Classify an image based on its natural dimensions and determine the best editorial layout.
 */
export function analyzeImage(width?: number | null, height?: number | null): ImageMeta | null {
  if (!width || !height || width <= 0 || height <= 0) {
    return null;
  }

  const aspectRatio = width / height;
  let orientation: ImageOrientation;
  let layout: EditorialLayout;

  if (aspectRatio < 0.85) {
    // 9:16, 4:5, 3:4 (Portrait)
    orientation = "portrait";
    layout = "split";
  } else if (aspectRatio >= 0.85 && aspectRatio <= 1.2) {
    // ~1:1 (Square)
    orientation = "square";
    layout = "card";
  } else if (aspectRatio > 1.2 && aspectRatio <= 2.5) {
    // 16:9, 3:2, 4:3 (Landscape)
    orientation = "landscape";
    layout = "hero";
  } else {
    // > 2.5 (Panorama / Ultra-wide)
    orientation = "ultra-wide";
    layout = "banner";
  }

  return {
    width,
    height,
    aspectRatio,
    orientation,
    layout,
  };
}

// In-memory cache for client-side probed dimensions to avoid re-fetching
const probeCache = new Map<string, { width: number; height: number }>();

/**
 * Client-side fallback: load an image natural size if width/height were not in DB.
 */
export function probeImageDimensions(src: string): Promise<{ width: number; height: number } | null> {
  if (!src) return Promise.resolve(null);
  if (probeCache.has(src)) {
    return Promise.resolve(probeCache.get(src)!);
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const meta = { width: img.naturalWidth, height: img.naturalHeight };
      probeCache.set(src, meta);
      resolve(meta);
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
