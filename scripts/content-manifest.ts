import fs from "fs";
import path from "path";
import crypto from "crypto";

const MANIFEST_PATH = path.join(process.cwd(), ".content-hashes.json");

export interface ContentManifest {
  [filePath: string]: string; // relative path -> md5 hash
}

export function loadManifest(): ContentManifest {
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
    } catch {
      return {};
    }
  }
  return {};
}

export function saveManifest(manifest: ContentManifest): void {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf-8");
}

export function computeFileHash(filePath: string): string | null {
  if (!fs.existsSync(filePath)) return null;
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash("md5").update(buffer).digest("hex");
}

export function hasFileChanged(filePath: string, manifest: ContentManifest): boolean {
  const relPath = path.relative(process.cwd(), filePath);
  const currentHash = computeFileHash(filePath);
  if (!currentHash) return false;
  return manifest[relPath] !== currentHash;
}

export function updateFileHash(filePath: string, manifest: ContentManifest): void {
  const relPath = path.relative(process.cwd(), filePath);
  const currentHash = computeFileHash(filePath);
  if (currentHash) {
    manifest[relPath] = currentHash;
  }
}
