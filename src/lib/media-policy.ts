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

export function validateMediaFile(filename: string, mimeType: string, sizeBytes: number) {
  if (typeof filename !== "string" || typeof mimeType !== "string" || filename.length > 255) return "Unsupported file type or extension";
  const policy = MEDIA_TYPES[mimeType.toLowerCase()];
  const extension = filename.split(".").pop()?.toLowerCase();
  if (!policy || !extension || !policy.extensions.includes(extension)) return "Unsupported file type or extension";
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0 || sizeBytes > policy.maxBytes) {
    return `File must be smaller than ${Math.round(policy.maxBytes / 1_000_000)} MB`;
  }
  return null;
}

export function mediaCategory(mimeType: string) {
  return MEDIA_TYPES[mimeType]?.category ?? (mimeType.startsWith("audio/") ? "audio" : mimeType.startsWith("video/") ? "video" : mimeType.startsWith("image/") ? "image" : "document");
}
