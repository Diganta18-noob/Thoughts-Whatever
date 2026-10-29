import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { GODDESS_REFERENCE_SLUG } from "../src/lib/reference/presentation";

// Run after rendering the supplied PDF to tmp/reference-import/page-NNN.jpg.
// Checkpoints make network retries safe; no license or public-domain claim is made.
const prisma = new PrismaClient();
const folder = path.resolve("tmp/reference-import");
const checkpointPath = path.join(folder, "uploaded.json");
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });

async function main() {
  const files = fs.readdirSync(folder).filter(f => /^page-\d+\.jpg$/.test(f)).sort();
  if (files.length !== 404) throw new Error(`Expected 404 rendered pages, found ${files.length}`);
  const uploaded: Record<string, string> = fs.existsSync(checkpointPath) ? JSON.parse(fs.readFileSync(checkpointPath, "utf8")) : {};
  let next = 0;
  await Promise.all(Array.from({ length: 5 }, async () => {
    while (next < files.length) {
      const file = files[next++];
      if (uploaded[file]) continue;
      const result = await cloudinary.uploader.upload(path.join(folder, file), { resource_type: "image", public_id: `reference/${GODDESS_REFERENCE_SLUG}/${file.slice(0, -4)}`, overwrite: false });
      uploaded[file] = result.secure_url;
      fs.writeFileSync(checkpointPath, JSON.stringify(uploaded));
      if (Object.keys(uploaded).length % 40 === 0) console.log(`Uploaded ${Object.keys(uploaded).length}/404 pages`);
    }
  }));
  const pages = await Promise.all(files.map(async (file, index) => {
    const meta = await sharp(path.join(folder, file)).metadata();
    return { pageNumber: index + 1, imageUrl: uploaded[file], thumbnailUrl: uploaded[file].replace('/upload/', '/upload/w_180/'), width: meta.width, height: meta.height };
  }));
  await prisma.$transaction(async tx => {
    const work = await tx.referenceWork.upsert({
      where: { slug: GODDESS_REFERENCE_SLUG },
      create: { slug: GODDESS_REFERENCE_SLUG, titleBn: "In the Name of the Goddess", titleEn: "In the Name of the Goddess", subtitleBn: "The Durga Pujas of Contemporary Kolkata", descriptionEn: "Tapati Guha-Thakurta’s study of the Durga Pujas of contemporary Kolkata.", type: "BOOK", language: "ENGLISH", subject: "Durga Puja, Kolkata, art and cultural history", published: true },
      update: {},
    });
    const existing = await tx.referenceEdition.findFirst({ where: { workId: work.id } });
    const data = { editionTitleBn: "The Durga Pujas of Contemporary Kolkata", publisher: "Primus Books", publicationYear: 2015, publicationPlace: "Delhi", isbn: "9789384082468", pages: 404, hostingMode: "THOUGHTS_WHATEVER" as const, coverImage: pages[2].imageUrl, readerManifest: { pageCount: 404, searchable: false, pages } };
    const edition = existing
      ? await tx.referenceEdition.update({ where: { id: existing.id }, data })
      : await tx.referenceEdition.create({ data: { ...data, workId: work.id, rights: { create: { status: "RIGHTS_UNVERIFIED" } } } });
    // This entry uses page images only. Never expose an original-file download link.
    await tx.referenceAsset.updateMany({ where: { editionId: edition.id }, data: { isDownloadable: false } });
    const scanAsset = await tx.referenceAsset.findFirst({ where: { editionId: edition.id, kind: "SCAN_IMAGE" } });
    if (!scanAsset) await tx.referenceAsset.create({ data: { editionId: edition.id, kind: "SCAN_IMAGE", title: "Book pages", fileUrl: pages[0].imageUrl, mimeType: "image/jpeg", isDownloadable: false, isOnlineReadable: true } });
    const instruction = "upload this to reference do not add any download option or any kind of lebel like licensed public domain something";
    if (!await tx.promptLog.findFirst({ where: { text: instruction } })) await tx.promptLog.create({ data: { text: instruction, source: "codex", category: "feature", status: "done", summary: "Add supplied Goddess PDF to Reference without downloads or rights labels", tags: ["reference"] } });
    console.log(JSON.stringify({ slug: work.slug, editionId: edition.id, pages: pages.length, downloads: false, rightsStatus: "RIGHTS_UNVERIFIED" }));
  });
}
main().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(() => prisma.$disconnect());
