export const MEDIA_TYPES: Record<string, { extensions: string[]; category: "image" | "audio" | "video" | "document"; maxBytes: number; resourceType: "image" | "video" | "raw" }> = {
  "image/jpeg": { extensions: ["jpg", "jpeg"], category: "image", maxBytes: 25_000_000, resourceType: "image" },
  "image/png": { extensions: ["png"], category: "image", maxBytes: 25_000_000, resourceType: "image" },
  "image/webp": { extensions: ["webp"], category: "image", maxBytes: 25_000_000, resourceType: "image" },
  "image/avif": { extensions: ["avif"], category: "image", maxBytes: 25_000_000, resourceType: "image" },
  "image/gif": { extensions: ["gif"], category: "image", maxBytes: 25_000_000, resourceType: "image" },
  "image/svg+xml": { extensions: ["svg"], category: "image", maxBytes: 5_000_000, resourceType: "image" },
  "audio/mpeg": { extensions: ["mp3"], category: "audio", maxBytes: 95_000_000, resourceType: "video" },
  "audio/mp3": { extensions: ["mp3"], category: "audio", maxBytes: 95_000_000, resourceType: "video" },
  "audio/mp4": { extensions: ["m4a", "mp4"], category: "audio", maxBytes: 95_000_000, resourceType: "video" },
  "audio/x-m4a": { extensions: ["m4a"], category: "audio", maxBytes: 95_000_000, resourceType: "video" },
  "audio/aac": { extensions: ["aac"], category: "audio", maxBytes: 95_000_000, resourceType: "video" },
  "audio/wav": { extensions: ["wav"], category: "audio", maxBytes: 95_000_000, resourceType: "video" },
  "audio/x-wav": { extensions: ["wav"], category: "audio", maxBytes: 95_000_000, resourceType: "video" },
  "audio/ogg": { extensions: ["ogg", "oga"], category: "audio", maxBytes: 95_000_000, resourceType: "video" },
  "audio/webm": { extensions: ["webm"], category: "audio", maxBytes: 95_000_000, resourceType: "video" },
  "audio/flac": { extensions: ["flac"], category: "audio", maxBytes: 95_000_000, resourceType: "video" },
  "video/mp4": { extensions: ["mp4"], category: "video", maxBytes: 95_000_000, resourceType: "video" },
  "video/webm": { extensions: ["webm"], category: "video", maxBytes: 95_000_000, resourceType: "video" },
  "video/quicktime": { extensions: ["mov"], category: "video", maxBytes: 95_000_000, resourceType: "video" },
  "application/pdf": { extensions: ["pdf"], category: "document", maxBytes: 25_000_000, resourceType: "raw" },
  "text/plain": { extensions: ["txt"], category: "document", maxBytes: 10_000_000, resourceType: "raw" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { extensions: ["docx"], category: "document", maxBytes: 25_000_000, resourceType: "raw" },
  "application/epub+zip": { extensions: ["epub"], category: "document", maxBytes: 25_000_000, resourceType: "raw" },
};

const EXTENSION_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  svg: "image/svg+xml",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  wav: "audio/wav",
  aac: "audio/aac",
  flac: "audio/flac",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  pdf: "application/pdf",
  txt: "text/plain",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  epub: "application/epub+zip",
};

export function resolveMimeType(filename: string, rawMimeType?: string): string {
  const extension = filename.split(".").pop()?.toLowerCase();
  const normalizedRaw = (rawMimeType || "").toLowerCase().trim();

  // If provided raw MIME type is recognized in MEDIA_TYPES, ensure it matches extension
  if (normalizedRaw && MEDIA_TYPES[normalizedRaw]) {
    const policy = MEDIA_TYPES[normalizedRaw];
    if (extension && policy.extensions.includes(extension)) {
      return normalizedRaw;
    }
  }

  // Fallback to inferred MIME type by extension
  if (extension && EXTENSION_TO_MIME[extension]) {
    return EXTENSION_TO_MIME[extension];
  }

  return normalizedRaw || "application/octet-stream";
}

export function validateMediaFile(filename: string, mimeType: string, sizeBytes: number) {
  if (typeof filename !== "string" || filename.length > 255) return "Unsupported file type or extension";
  const resolvedMime = resolveMimeType(filename, mimeType);
  const policy = MEDIA_TYPES[resolvedMime.toLowerCase()];
  const extension = filename.split(".").pop()?.toLowerCase();
  if (!policy || !extension || !policy.extensions.includes(extension)) return "Unsupported file type or extension";
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > policy.maxBytes) {
    return `File must be smaller than ${Math.round(policy.maxBytes / 1_000_000)} MB`;
  }
  return null;
}

export function mediaCategory(mimeType: string): "image" | "audio" | "video" | "document" {
  const normalized = mimeType.toLowerCase();
  return (
    MEDIA_TYPES[normalized]?.category ??
    (normalized.startsWith("audio/")
      ? "audio"
      : normalized.startsWith("video/")
      ? "video"
      : normalized.startsWith("image/")
      ? "image"
      : "document")
  );
}

export function detectOrientation(
  width?: number | null,
  height?: number | null
): "landscape" | "portrait" | "square" | null {
  if (!width || !height || width <= 0 || height <= 0) return null;
  const ratio = width / height;
  if (ratio >= 1.08) return "landscape";
  if (ratio <= 0.92) return "portrait";
  return "square";
}

export function formatDuration(seconds?: number | null): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds < 0) {
    return "--:--";
  }
  const total = Math.round(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export const ACCEPT_MEDIA_STRING = [
  ".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".svg",
  ".mp3", ".m4a", ".wav", ".aac", ".ogg", ".oga", ".flac",
  ".mp4", ".webm", ".mov",
  ".pdf", ".txt", ".docx", ".epub",
  "image/jpeg", "image/png", "image/webp", "image/avif", "image/gif", "image/svg+xml",
  "audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a", "audio/aac", "audio/wav", "audio/x-wav", "audio/ogg", "audio/webm", "audio/flac",
  "video/mp4", "video/webm", "video/quicktime",
  "application/pdf", "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/epub+zip",
].join(",");

