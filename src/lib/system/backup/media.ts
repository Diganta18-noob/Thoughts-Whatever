import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function backupMedia(targetDir: string): Promise<{
  mediaManifestPath: string;
  fileCount: number;
  totalSizeBytes: number;
}> {
  const mediaDir = path.join(targetDir, "media");
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
  }

  const manifestPath = path.join(targetDir, "media-manifest.json");
  let fileCount = 0;
  let totalSizeBytes = 0;
  const resourcesList: any[] = [];

  try {
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
      // List resources from Cloudinary
      const result = await cloudinary.api.resources({
        max_results: 500,
        resource_type: "image",
      });

      for (const res of result.resources || []) {
        resourcesList.push({
          public_id: res.public_id,
          format: res.format,
          bytes: res.bytes,
          url: res.secure_url,
          created_at: res.created_at,
        });
        totalSizeBytes += res.bytes || 0;
        fileCount++;
      }
    }
  } catch (err) {
    console.warn("Cloudinary API fetch failed or missing credentials. Creating empty media manifest.", err);
  }

  fs.writeFileSync(manifestPath, JSON.stringify(resourcesList, null, 2));

  return {
    mediaManifestPath: manifestPath,
    fileCount,
    totalSizeBytes,
  };
}
