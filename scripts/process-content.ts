import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { PieceKind, TagKind } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { bengaliSlug, readingMinutes } from "../src/lib/bengali";
import { deriveExcerpt, extractHeadings } from "../src/lib/markdown";
import {
  formatArticleBody,
  generateSeriesMetadata,
  generateEpisodeMetadata,
  generateSocialCaptions,
} from "./content-ai";
import { saveSocialCaptions, runQualityCheck, printOutputSummary } from "./content-output";

import sharp from "sharp";

// Configure Cloudinary if available
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

/**
 * Compress image using sharp (1600px width max WebP) then upload to Cloudinary CDN.
 * Fallback to lightweight WebP Data URI if Cloudinary is unavailable.
 */
async function uploadImage(imagePath: string, folderName = "thoughts-whatever"): Promise<string | null> {
  if (!fs.existsSync(imagePath)) return null;

  try {
    const rawBuffer = fs.readFileSync(imagePath);
    // Compress to optimized WebP buffer first
    const optimizedBuffer = await sharp(rawBuffer)
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const dataUri = `data:image/webp;base64,${optimizedBuffer.toString("base64")}`;

    if (cloudName && apiKey && apiSecret) {
      try {
        console.log(`  📤 Uploading optimized WebP thumbnail to Cloudinary: ${path.basename(imagePath)}...`);
        const result = await cloudinary.uploader.upload(dataUri, {
          folder: folderName,
          transformation: [{ width: 1600, crop: "limit" }, { quality: "auto:good" }, { fetch_format: "auto" }],
        });
        return result.secure_url;
      } catch (err) {
        console.warn("  ⚠️ Cloudinary upload failed, using optimized WebP Data URI fallback:", err);
      }
    }

    return dataUri;
  } catch (err) {
    console.error("  ❌ Failed processing image with sharp:", err);
    return null;
  }
}

/**
 * Find matching thumbnail file in Thumbnail directory for an episode.
 */
function findThumbnail(thumbnailDir: string, episodeBaseName: string): string | null {
  if (!fs.existsSync(thumbnailDir)) return null;

  const validExts = [".png", ".jpg", ".jpeg", ".webp"];
  const files = fs.readdirSync(thumbnailDir);

  // Normalize spaces for comparison
  const normalizedTarget = episodeBaseName.trim().replace(/\s+/g, " ").toLowerCase();

  for (const file of files) {
    const ext = path.extname(file);
    if (!validExts.includes(ext.toLowerCase())) continue;

    const base = path.basename(file, ext).trim().replace(/\s+/g, " ").toLowerCase();
    if (base === normalizedTarget) {
      return path.join(thumbnailDir, file);
    }
  }

  // Soft fallback: check prefix match
  for (const file of files) {
    const ext = path.extname(file);
    if (!validExts.includes(ext.toLowerCase())) continue;
    const base = path.basename(file, ext).trim().replace(/\s+/g, " ").toLowerCase();
    if (base.startsWith(normalizedTarget) || normalizedTarget.startsWith(base)) {
      return path.join(thumbnailDir, file);
    }
  }

  return null;
}

/**
 * Extract episode number from filename (e.g., "মেঘনাদবধ কাব্য 1" -> 1, "পর্ব-২" -> 2, "অন্তিম পর্ব" -> 3).
 */
function extractEpisodeNumber(filename: string): number {
  if (filename.includes("অন্তিম") || filename.toLowerCase().includes("final")) {
    return 3;
  }
  const bengaliDigits: Record<string, string> = {
    "১": "1", "২": "2", "৩": "3", "৪": "4", "৫": "5",
    "৬": "6", "৭": "7", "৮": "8", "৯": "9", "০": "0",
  };
  const converted = filename.replace(/[১-৯০]/g, (d) => bengaliDigits[d] || d);
  const match = converted.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 1;
}

async function findAuthorForSeries(seriesTitle: string) {
  const title = seriesTitle.toLowerCase();
  if (title.includes("চোখের বালি") || title.includes("chokher bali")) {
    return await prisma.author.findFirst({ where: { slug: "রবীন্দ্রনাথ-ঠাকুর" } });
  }
  if (title.includes("আনন্দমঠ") || title.includes("anandamath")) {
    return await prisma.author.findFirst({ where: { slug: "বঙ্কিমচন্দ্র-চট্টোপাধ্যায়" } });
  }
  if (title.includes("নীলদর্পণ") || title.includes("nildarpan") || title.includes("dinabandhu") || title.includes("দীনবন্ধু")) {
    let author = await prisma.author.findFirst({ where: { slug: "দীনবন্ধু-মিত্র" } });
    if (!author) {
      author = await prisma.author.create({
        data: {
          nameBn: "দীনবন্ধু মিত্র",
          nameEn: "Dinabandhu Mitra",
          slug: "দীনবন্ধু-মিত্র",
          bioBn: "বাংলা নাট্যসাহিত্যের অন্যতম শ্রেষ্ঠ নাট্যকার ও নীলদর্পণ নাটকের স্রষ্টা।",
        },
      });
    }
    return author;
  }
  if (title.includes("মেঘনাদ") || title.includes("meghnad")) {
    let author = await prisma.author.findFirst({ where: { slug: "মাইকেল-মধুসূদন-দত্ত" } });
    if (!author) {
      author = await prisma.author.create({
        data: {
          nameBn: "মাইকেল মধুসূদন দত্ত",
          nameEn: "Michael Madhusudan Dutt",
          slug: "মাইকেল-মধুসূদন-দত্ত",
          bioBn: "বাংলা সাহিত্যের অন্যতম শ্রেষ্ঠ মহাকবি এবং অমিত্রাক্ষর ছন্দের প্রবর্তক।",
        },
      });
    }
    return author;
  }
  if (title.includes("crime") || title.includes("dostoevsky")) {
    return await prisma.author.findFirst({ where: { slug: "fyodor-dostoevsky" } });
  }
  return null;
}

async function main() {
  console.log("🚀 Thoughts Whatever — Content Automation Engine Starting...\n");

  const contentBaseDir = path.join(process.cwd(), "Content");
  const contextBaseDir = path.join(contentBaseDir, "context");
  const thumbnailBaseDir = path.join(contentBaseDir, "Thumnail"); // handling folder name

  if (!fs.existsSync(contextBaseDir)) {
    console.error(`❌ Context directory not found at ${contextBaseDir}`);
    process.exit(1);
  }

  const seriesFolders = fs
    .readdirSync(contextBaseDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  if (seriesFolders.length === 0) {
    console.log("ℹ️ No series folders found inside Content/context/");
    process.exit(0);
  }

  for (const folderName of seriesFolders) {
    const contextSeriesDir = path.join(contextBaseDir, folderName);
    let thumbnailSeriesDir = path.join(thumbnailBaseDir, folderName);
    if (!fs.existsSync(thumbnailSeriesDir)) {
      const cleanName = folderName.replace(/\s*-\s*[^\n]+$/i, "").replace(/\s*Series\s*$/i, "").trim();
      const altThumb = path.join(thumbnailBaseDir, cleanName);
      if (fs.existsSync(altThumb)) {
        thumbnailSeriesDir = altThumb;
      }
    }

    // Clean series title (remove author suffix like " - দীনবন্ধু মিত্র" and "Series" suffix if present)
    const cleanSeriesTitle = folderName
      .replace(/\s*-\s*[^\n]+$/i, "")
      .replace(/\s*Series\s*$/i, "")
      .trim();
    const seriesSlug = bengaliSlug(cleanSeriesTitle);

    console.log(`\n📚 Processing Series Folder: "${folderName}" -> Title: "${cleanSeriesTitle}"`);

    // List all text/md files inside context folder
    const episodeFiles = fs
      .readdirSync(contextSeriesDir)
      .filter((file) => (file.endsWith(".txt") || file.endsWith(".md")) && !file.endsWith(".social.md"));

    if (episodeFiles.length === 0) {
      console.log(`  ⚠️ No text files found in ${contextSeriesDir}`);
      continue;
    }

    // Read sample text for series metadata generation if needed
    const sampleText = fs.readFileSync(path.join(contextSeriesDir, episodeFiles[0]), "utf-8");

    // STEP 3 & 4: Check or Create Series
    let series = await prisma.series.findUnique({ where: { slug: seriesSlug } });

    if (!series) {
      console.log(`  ✨ Creating new Series: "${cleanSeriesTitle}"...`);
      const seriesAiMeta = await generateSeriesMetadata(cleanSeriesTitle, sampleText);

      // Find series cover thumbnail if available
      const seriesCoverPath = findThumbnail(thumbnailSeriesDir, cleanSeriesTitle) ||
        findThumbnail(thumbnailSeriesDir, `${cleanSeriesTitle} 1`) ||
        findThumbnail(thumbnailSeriesDir, `${cleanSeriesTitle} cover`);
      const seriesCoverUrl = seriesCoverPath ? await uploadImage(seriesCoverPath, "series-covers") : null;

      series = await prisma.series.create({
        data: {
          slug: seriesSlug,
          titleBn: cleanSeriesTitle,
          titleEn: seriesAiMeta.titleEn,
          descBn: seriesAiMeta.descBn,
          coverImage: seriesCoverUrl,
        },
      });
      console.log(`  ✅ Series Created: ID ${series.id} (slug: ${series.slug})`);
    } else {
      console.log(`  ℹ️ Found existing Series: ID ${series.id} (slug: ${series.slug})`);
      if (!series.coverImage) {
        const seriesCoverPath = findThumbnail(thumbnailSeriesDir, cleanSeriesTitle) ||
          findThumbnail(thumbnailSeriesDir, `${cleanSeriesTitle} 1`) ||
          findThumbnail(thumbnailSeriesDir, `${cleanSeriesTitle} cover`);
        if (seriesCoverPath) {
          const seriesCoverUrl = await uploadImage(seriesCoverPath, "series-covers");
          if (seriesCoverUrl) {
            series = await prisma.series.update({
              where: { id: series.id },
              data: { coverImage: seriesCoverUrl },
            });
            console.log(`  🖼️ Updated Series cover image for ${series.titleBn}`);
          }
        }
      }
    }

    // Sort episode files numerically by number in filename
    episodeFiles.sort((a, b) => extractEpisodeNumber(a) - extractEpisodeNumber(b));

    const existingSlugs = (await prisma.piece.findMany({ select: { slug: true } })).map((p) => p.slug);

    // Process each episode
    for (const file of episodeFiles) {
      const filePath = path.join(contextSeriesDir, file);
      const fileBaseName = path.basename(file, path.extname(file));
      const episodeNumber = extractEpisodeNumber(fileBaseName);

      console.log(`\n  📝 STEP 1: Reading Context File: "${file}"...`);
      const rawText = fs.readFileSync(filePath, "utf-8");

      console.log(`  🎨 STEP 2: Inspecting & Locating Thumbnail...`);
      const thumbnailPath = findThumbnail(thumbnailSeriesDir, fileBaseName);
      let coverImageUrl: string | null = null;

      if (thumbnailPath) {
        console.log(`    Found thumbnail: ${path.basename(thumbnailPath)}`);
        coverImageUrl = await uploadImage(thumbnailPath, `episodes/${seriesSlug}`);
      } else {
        console.warn(`    ⚠️ Thumbnail not found for ${fileBaseName} in ${thumbnailSeriesDir}`);
      }

      console.log(`  ✍️ STEP 6: Formatting Article into Premium Markdown...`);
      const formattedBody = await formatArticleBody(rawText, fileBaseName);

      console.log(`  🤖 STEP 5, 9, 10, 11, 12: Generating AI Metadata & SEO...`);
      const epAiMeta = await generateEpisodeMetadata(cleanSeriesTitle, fileBaseName, formattedBody, episodeNumber);

      const readingMins = readingMinutes(formattedBody);

      // Determine PieceKind (default to DOCUMENTARY so all pieces render with cinematic hero & sidebar widgets)
      let kind: PieceKind = PieceKind.DOCUMENTARY;
      if (epAiMeta.category.toLowerCase().includes("blog")) kind = PieceKind.BLOG;

      // Handle tags upsert
      const tagIds: string[] = [];
      const allTags = [...epAiMeta.bengaliTags];

      for (let i = 0; i < allTags.length; i++) {
        const tagBn = allTags[i];
        const tagEn = epAiMeta.englishTags[i] || null;
        const tagSlug = bengaliSlug(tagBn) || `tag-${Date.now()}-${i}`;

        let tag = await prisma.tag.findUnique({ where: { slug: tagSlug } });
        if (!tag) {
          tag = await prisma.tag.create({
            data: {
              slug: tagSlug,
              labelBn: tagBn,
              labelEn: tagEn,
              kind: TagKind.TOPIC,
            },
          });
        }
        tagIds.push(tag.id);
      }

      // Generate standard SEO URL slug & Clean Title
      let pieceSlug = `${seriesSlug}-${episodeNumber}`;
      let formattedTitleBn = fileBaseName.trim();
      if (episodeNumber === 1 && !formattedTitleBn.includes("|") && !formattedTitleBn.includes("পর্ব") && !/\d/.test(formattedTitleBn)) {
        formattedTitleBn = cleanSeriesTitle;
      } else if (episodeNumber === 2 && !formattedTitleBn.includes("|") && !/\d/.test(formattedTitleBn)) {
        formattedTitleBn = `${cleanSeriesTitle} | পর্ব-২`;
      } else if (episodeNumber === 3 && formattedTitleBn.includes("অন্তিম")) {
        formattedTitleBn = `${cleanSeriesTitle} | অন্তিম পর্ব`;
      }

      const author = await findAuthorForSeries(cleanSeriesTitle);
      const publishedAt = new Date();
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thoughts-whatever.vercel.app";
      const fullUrl = `${baseUrl}/writing/${pieceSlug}`;

      // Check if piece already exists by slug or (seriesId + seriesOrder)
      let existingPiece = await prisma.piece.findFirst({
        where: {
          OR: [
            { slug: pieceSlug },
            { AND: [{ seriesId: series.id }, { seriesOrder: episodeNumber }] },
          ],
        },
      });

      let piece;
      if (existingPiece) {
        console.log(`  🔄 Updating existing Episode #${episodeNumber} (ID: ${existingPiece.id})...`);
        piece = await prisma.piece.update({
          where: { id: existingPiece.id },
          data: {
            kind,
            status: "PUBLISHED",
            slug: pieceSlug,
            titleBn: formattedTitleBn,
            titleEn: epAiMeta.titleEn,
            bodyBn: formattedBody,
            excerptBn: epAiMeta.excerpt || deriveExcerpt(formattedBody),
            coverImage: coverImageUrl || existingPiece.coverImage,
            readingMinutes: readingMins,
            featured: true, // Show on landing page
            seoDescription: epAiMeta.seoDescription,
            ogImage: coverImageUrl || existingPiece.coverImage,
            publishedAt: existingPiece.publishedAt || publishedAt,
            seriesId: series.id,
            seriesOrder: episodeNumber,
            tags: { set: tagIds.map((id) => ({ id })) },
            authors: author ? { set: [{ id: author.id }] } : undefined,
          },
        });
      } else {
        console.log(`  ✨ Creating new Episode #${episodeNumber}...`);
        piece = await prisma.piece.create({
          data: {
            kind,
            status: "PUBLISHED",
            slug: pieceSlug,
            titleBn: formattedTitleBn,
            titleEn: epAiMeta.titleEn,
            bodyBn: formattedBody,
            excerptBn: epAiMeta.excerpt || deriveExcerpt(formattedBody),
            coverImage: coverImageUrl,
            readingMinutes: readingMins,
            featured: true, // Show on landing page
            seoDescription: epAiMeta.seoDescription,
            ogImage: coverImageUrl,
            publishedAt,
            seriesId: series.id,
            seriesOrder: episodeNumber,
            tags: { connect: tagIds.map((id) => ({ id })) },
            authors: author ? { connect: [{ id: author.id }] } : undefined,
          },
        });
      }

      // STEP 15: Generate & Save Social Captions
      console.log(`  📱 STEP 15: Generating Social Media Captions...`);
      const socialCaptions = await generateSocialCaptions(
        cleanSeriesTitle,
        fileBaseName,
        epAiMeta.excerpt,
        epAiMeta.quote,
        fullUrl
      );
      const socialFile = saveSocialCaptions(filePath, socialCaptions, fileBaseName, cleanSeriesTitle);
      console.log(`    Saved captions to: ${path.basename(socialFile)}`);

      // STEP 21: Quality Check
      const qReport = runQualityCheck({
        titleBn: piece.titleBn,
        bodyBn: piece.bodyBn,
        slug: piece.slug,
        coverImage: piece.coverImage,
        seriesSlug: series.slug,
        seoDescription: piece.seoDescription,
        tags: allTags,
        existingSlugs,
      });

      if (qReport.issues.length > 0) {
        console.warn(`  ⚠️ Quality Check Warnings:`, qReport.issues);
      }

      // STEP 22: Output Summary
      printOutputSummary(cleanSeriesTitle, fileBaseName, piece.slug);
    }

    // STEP 13 & 19: Update Series updatedAt to bump to top of landing page
    await prisma.series.update({
      where: { id: series.id },
      data: { updatedAt: new Date() },
    });
  }

  // Process Solo Standalone Articles
  const soloBaseDir = path.join(process.cwd(), "Content", "solo");
  const soloThumbnailDir = path.join(process.cwd(), "Content", "Thumnail", "Solo");

  if (fs.existsSync(soloBaseDir)) {
    const soloFiles = fs
      .readdirSync(soloBaseDir)
      .filter((file) => (file.endsWith(".txt") || file.endsWith(".md")) && !file.endsWith(".social.md"));

    for (const file of soloFiles) {
      const filePath = path.join(soloBaseDir, file);
      const titleBn = path.basename(file, path.extname(file));
      const slug = bengaliSlug(titleBn);

      console.log(`\n📄 Processing Solo Article: "${file}" -> Title: "${titleBn}" (slug: ${slug})`);

      const rawContent = fs.readFileSync(filePath, "utf-8");
      const formattedBody = await formatArticleBody(rawContent, titleBn);
      const epAiMeta = await generateEpisodeMetadata(titleBn, titleBn, formattedBody, 1);

      const coverPath = findThumbnail(soloThumbnailDir, titleBn);
      const coverImageUrl = coverPath ? await uploadImage(coverPath, "piece-covers") : null;

      const readingMins = readingMinutes(formattedBody);

      let tagIds: string[] = [];
      if (epAiMeta.bengaliTags && epAiMeta.bengaliTags.length > 0) {
        for (const tName of epAiMeta.bengaliTags) {
          const tSlug = bengaliSlug(tName);
          const tag = await prisma.tag.upsert({
            where: { slug: tSlug },
            update: { labelBn: tName },
            create: { slug: tSlug, labelBn: tName, kind: TagKind.TOPIC },
          });
          tagIds.push(tag.id);
        }
      }

      // Check for Tagore author
      const tagoreAuthor = await prisma.author.findFirst({ where: { slug: "রবীন্দ্রনাথ-ঠাকুর" } });

      const existingPiece = await prisma.piece.findUnique({ where: { slug }, include: { authors: true } });

      const pieceData = {
        titleBn,
        titleEn: epAiMeta.titleEn,
        bodyBn: formattedBody,
        excerptBn: epAiMeta.excerpt || deriveExcerpt(formattedBody),
        coverImage: coverImageUrl || existingPiece?.coverImage,
        readingMinutes: readingMins,
        featured: true,
        seoDescription: epAiMeta.seoDescription,
        ogImage: coverImageUrl || existingPiece?.ogImage,
        publishedAt: existingPiece?.publishedAt || new Date(),
        tags: { connect: tagIds.map((id) => ({ id })) },
        authors: existingPiece?.authors ? undefined : (tagoreAuthor ? { connect: [{ id: tagoreAuthor.id }] } : undefined),
      };

      if (existingPiece) {
        await prisma.piece.update({
          where: { id: existingPiece.id },
          data: {
            titleBn,
            titleEn: epAiMeta.titleEn,
            bodyBn: formattedBody,
            excerptBn: epAiMeta.excerpt || deriveExcerpt(formattedBody),
            coverImage: coverImageUrl || existingPiece.coverImage,
            readingMinutes: readingMins,
            featured: true,
            seoDescription: epAiMeta.seoDescription,
            ogImage: coverImageUrl || existingPiece.ogImage,
            kind: PieceKind.DOCUMENTARY,
          },
        });
        console.log(`  🔄 Updated Solo Article: "${titleBn}"`);
      } else {
        await prisma.piece.create({
          data: {
            ...pieceData,
            slug,
            kind: PieceKind.DOCUMENTARY,
            status: "PUBLISHED",
          },
        });
        console.log(`  ✨ Created Solo Article: "${titleBn}"`);
      }
    }
  }

  console.log("\n🎉 ALL CONTENT PROCESSED SUCCESSFULLY!");
  await prisma.$disconnect();
}

export { main as processContent };

if (require.main === module) {
  main().catch(async (e) => {
    console.error("❌ Fatal processing error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
}
