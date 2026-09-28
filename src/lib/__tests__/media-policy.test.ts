import {
  validateMediaFile,
  MEDIA_TYPES,
  resolveMimeType,
  detectOrientation,
  formatDuration,
} from "@/lib/media-policy";

describe("media upload policy", () => {
  it("accepts landscape images, audio, video and documents within their limits", () => {
    expect(validateMediaFile("landscape.webp", "image/webp", 8_000_000)).toBeNull();
    expect(validateMediaFile("narration.mp3", "audio/mpeg", 70_000_000)).toBeNull();
    expect(validateMediaFile("voice.m4a", "audio/mp4", 45_000_000)).toBeNull();
    expect(validateMediaFile("recording.wav", "audio/wav", 50_000_000)).toBeNull();
    expect(validateMediaFile("film.mp4", "video/mp4", 90_000_000)).toBeNull();
    expect(validateMediaFile("book.pdf", "application/pdf", 20_000_000)).toBeNull();
    expect(MEDIA_TYPES["audio/mpeg"].resourceType).toBe("video");
    expect(MEDIA_TYPES["audio/mp4"].resourceType).toBe("video");
  });

  it("infers MIME type when browser provides empty or generic MIME type", () => {
    expect(resolveMimeType("recording.m4a", "")).toBe("audio/mp4");
    expect(resolveMimeType("speech.mp3", "application/octet-stream")).toBe("audio/mpeg");
    expect(resolveMimeType("audio.wav", "")).toBe("audio/wav");
    expect(resolveMimeType("photo.jpg", "")).toBe("image/jpeg");
    expect(validateMediaFile("recording.m4a", "", 12_000_000)).toBeNull();
    expect(validateMediaFile("track.mp3", "application/octet-stream", 15_000_000)).toBeNull();
  });

  it("detects image and video orientations accurately", () => {
    expect(detectOrientation(1920, 1080)).toBe("landscape");
    expect(detectOrientation(1200, 630)).toBe("landscape");
    expect(detectOrientation(1080, 1920)).toBe("portrait");
    expect(detectOrientation(800, 1200)).toBe("portrait");
    expect(detectOrientation(1000, 1000)).toBe("square");
    expect(detectOrientation(null, 1000)).toBeNull();
  });

  it("formats audio and video durations cleanly", () => {
    expect(formatDuration(0)).toBe("00:00");
    expect(formatDuration(45)).toBe("00:45");
    expect(formatDuration(185)).toBe("03:05");
    expect(formatDuration(3665)).toBe("1:01:05");
    expect(formatDuration(null)).toBe("--:--");
  });

  it("rejects mismatched extensions, unsupported types and oversized files", () => {
    expect(validateMediaFile("script.html", "image/svg+xml", 1000)).toMatch(/Unsupported/);
    expect(validateMediaFile("malware.exe", "application/octet-stream", 1000)).toMatch(/Unsupported/);
    expect(validateMediaFile("large.mp3", "audio/mpeg", 96_000_000)).toMatch(/smaller/);
    expect(validateMediaFile("empty.jpg", "image/jpeg", 0)).toMatch(/smaller/);
  });
});
