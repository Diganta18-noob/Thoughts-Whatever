import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
import { v2 as cloudinary } from "cloudinary";
import { prisma } from "../src/lib/prisma";
import sharp from "sharp";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadImage(imagePath: string, folderName: string): Promise<string> {
  const rawBuffer = fs.readFileSync(imagePath);
  const optimizedBuffer = await sharp(rawBuffer)
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const dataUri = `data:image/webp;base64,${optimizedBuffer.toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: folderName,
    transformation: [{ width: 1600, crop: "limit" }, { quality: "auto:good" }, { fetch_format: "auto" }],
  });
  return result.secure_url;
}

async function main() {
  console.log("Fixing Chokher Bali cover art & episode thumbnails...");

  const thumbDir = path.join(process.cwd(), "Content", "Thumnail", "চোখের বালি");

  const ep1Path = path.join(thumbDir, "চোখের বালি.PNG");
  const ep2Path = path.join(thumbDir, "চোখের বালি  পর্ব-২.PNG");
  const ep3Path = path.join(thumbDir, "চোখের বালি   অন্তিম পর্ব.PNG");

  console.log("1. Uploading Episode 1 thumbnail (চোখের বালি.PNG)...");
  const ep1Url = await uploadImage(ep1Path, "episodes/চোখের-বালি");
  console.log("   URL:", ep1Url);

  console.log("2. Uploading Episode 2 thumbnail (চোখের বালি  পর্ব-২.PNG)...");
  const ep2Url = await uploadImage(ep2Path, "episodes/চোখের-বালি");
  console.log("   URL:", ep2Url);

  console.log("3. Uploading Episode 3 thumbnail (চোখের বালি   অন্তিম পর্ব.PNG)...");
  const ep3Url = await uploadImage(ep3Path, "episodes/চোখের-বালি");
  console.log("   URL:", ep3Url);

  console.log("4. Updating Series cover to Episode 1 artwork...");
  await prisma.series.update({
    where: { slug: "চোখের-বালি" },
    data: { coverImage: ep1Url },
  });

  console.log("5. Updating Episode 1 piece (চোখের-বালি-1)...");
  await prisma.piece.update({
    where: { slug: "চোখের-বালি-1" },
    data: { coverImage: ep1Url, ogImage: ep1Url },
  });

  console.log("6. Updating Episode 2 piece (চোখের-বালি-2)...");
  await prisma.piece.update({
    where: { slug: "চোখের-বালি-2" },
    data: { coverImage: ep2Url, ogImage: ep2Url },
  });

  console.log("7. Updating Episode 3 piece (চোখের-বালি-3)...");
  await prisma.piece.update({
    where: { slug: "চোখের-বালি-3" },
    data: { coverImage: ep3Url, ogImage: ep3Url },
  });

  console.log("🎉 All Chokher Bali thumbnails and covers fixed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
