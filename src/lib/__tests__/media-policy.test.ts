import { validateMediaFile, MEDIA_TYPES } from "@/lib/media-policy";

describe("media upload policy", () => {
  it("accepts landscape images, audio, video and documents within their limits", () => {
    expect(validateMediaFile("landscape.webp", "image/webp", 8_000_000)).toBeNull();
    expect(validateMediaFile("narration.mp3", "audio/mpeg", 70_000_000)).toBeNull();
    expect(validateMediaFile("film.mp4", "video/mp4", 90_000_000)).toBeNull();
    expect(validateMediaFile("book.pdf", "application/pdf", 20_000_000)).toBeNull();
    expect(MEDIA_TYPES["audio/mpeg"].resourceType).toBe("video");
  });

  it("rejects mismatched extensions, unsupported types and oversized files", () => {
    expect(validateMediaFile("script.html", "image/svg+xml", 1000)).toMatch(/Unsupported/);
    expect(validateMediaFile("malware.exe", "application/octet-stream", 1000)).toMatch(/Unsupported/);
    expect(validateMediaFile("large.mp3", "audio/mpeg", 96_000_000)).toMatch(/smaller/);
    expect(validateMediaFile("empty.jpg", "image/jpeg", 0)).toMatch(/smaller/);
  });
});
