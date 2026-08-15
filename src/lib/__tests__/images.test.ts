import { describe, it, expect } from "@jest/globals";
import { coverSrc, isOptimizable, coverMime, normalizeMime } from "@/lib/images";

describe("coverSrc", () => {
  it("proxies a data URI through the cover endpoint instead of inlining it", () => {
    const huge = `data:image/webp;base64,${"A".repeat(300_000)}`;
    const src = coverSrc("piece", "crime-and-punishment-3", huge);
    expect(src).toBe("/api/cover/piece/crime-and-punishment-3");
    expect(src.length).toBeLessThan(80);
  });

  it("percent-encodes Bengali slugs", () => {
    const src = coverSrc("piece", "রক্তকরবী", "data:image/webp;base64,AAAA");
    expect(src).toBe(`/api/cover/piece/${encodeURIComponent("রক্তকরবী")}`);
  });

  it("falls back to the endpoint when no cover is stored", () => {
    expect(coverSrc("piece", "x", null)).toBe("/api/cover/piece/x");
    expect(coverSrc("piece", "x", "   ")).toBe("/api/cover/piece/x");
  });

  it("passes a real CDN url straight through", () => {
    const url = "https://res.cloudinary.com/demo/image/upload/v1/a.webp";
    expect(coverSrc("piece", "x", url)).toBe(url);
  });

  it("uses the series owner segment for series covers", () => {
    expect(coverSrc("series", "আনন্দমঠ", "data:image/webp;base64,AAAA")).toBe(
      `/api/cover/series/${encodeURIComponent("আনন্দমঠ")}`,
    );
  });
});

describe("isOptimizable", () => {
  it("optimizes the cover endpoint path", () => {
    expect(isOptimizable("/api/cover/piece/x")).toBe(true);
  });

  it("optimizes allow-listed remote hosts", () => {
    expect(isOptimizable("https://res.cloudinary.com/demo/a.webp")).toBe(true);
    expect(isOptimizable("https://evil.example.com/a.webp")).toBe(false);
  });
});

describe("mime helpers", () => {
  it("normalises aliases", () => {
    expect(normalizeMime("image/JPG")).toBe("image/jpeg");
  });

  it("reads the mime out of a data URI", () => {
    expect(coverMime("data:image/webp;base64,AAAA")).toBe("image/webp");
  });
});
