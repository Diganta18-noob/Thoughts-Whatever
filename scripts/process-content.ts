import dotenv from "dotenv";
dotenv.config();

import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { PieceKind, TagKind } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { syncAllMediaUsage } from "../src/lib/media";
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
const uploadedImageDetails = new Map<string, { width: number; height: number; sizeBytes: number }>();

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

const KNOWN_REEL_METADATA: Record<string, { reelUrl: string; publishedAt: string }> = {
  // Pather Dabi
  "পথের-দাবি-1": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcB46f2uwfN/", publishedAt: "2026-08-14T00:00:00.000Z" },
  "পথের-দাবী-1": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcB46f2uwfN/", publishedAt: "2026-08-14T00:00:00.000Z" },
  "পথের-দাবি-2": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcD08q1gNlp/", publishedAt: "2026-08-15T00:00:00.000Z" },
  "পথের-দাবী-2": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcD08q1gNlp/", publishedAt: "2026-08-15T00:00:00.000Z" },
  "পথের-দাবি-3": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcGXn3NA0OL/", publishedAt: "2026-08-16T00:00:00.000Z" },
  "পথের-দাবী-3": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcGXn3NA0OL/", publishedAt: "2026-08-16T00:00:00.000Z" },

  // Nildarpan
  "নীলদর্পণ-1": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/Dbvu34ShwC4/", publishedAt: "2026-08-07T00:00:00.000Z" },
  "নীলদর্পণ-2": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/Dbx9lAngmrd/", publishedAt: "2026-08-08T00:00:00.000Z" },
  "নীলদর্পণ-3": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/Db0OSW4AlG5/", publishedAt: "2026-08-09T00:00:00.000Z" },

  // Chokher Bali
  "চোখের-বালি-1": { reelUrl: "https://www.instagram.com/reel/DbdTwFZg-lO/", publishedAt: "2026-07-31T00:00:00.000Z" },
  "চোখের-বালি-2": { reelUrl: "https://www.instagram.com/reel/DbfnmrGgT9r/", publishedAt: "2026-08-01T00:00:00.000Z" },
  "চোখের-বালি-3": { reelUrl: "https://www.instagram.com/reel/DbisO90A4Ue/", publishedAt: "2026-08-02T00:00:00.000Z" },

  // Anandamath
  "আনন্দমঠ-1": { reelUrl: "https://www.instagram.com/reel/DbLdluTAjdQ/", publishedAt: "2026-07-24T00:00:00.000Z" },
  "আনন্দমঠ-2": { reelUrl: "https://www.instagram.com/reel/DbN0VN-A5CQ/", publishedAt: "2026-07-25T00:00:00.000Z" },
  "আনন্দমঠ-3": { reelUrl: "https://www.instagram.com/reel/DbQbrhnAzSq/", publishedAt: "2026-07-26T00:00:00.000Z" },

  // Crime and Punishment
  "crime-and-punishment-1": { reelUrl: "https://www.instagram.com/reel/DbEI_jtTXwB/", publishedAt: "2026-07-21T00:00:00.000Z" },
  "crime-and-punishment-2": { reelUrl: "https://www.instagram.com/reel/DbEsky0TM4x/", publishedAt: "2026-07-22T00:00:00.000Z" },
  "crime-and-punishment-3": { reelUrl: "https://www.instagram.com/reel/DbFdwblgEXF/", publishedAt: "2026-07-22T00:00:00.000Z" },

  // Solos
  "রক্তকরবী": { reelUrl: "https://www.instagram.com/reel/DbDwCbkgfYw/", publishedAt: "2026-07-21T00:00:00.000Z" },
  "দেবী": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DbTEHQPA5u3/", publishedAt: "2026-07-27T00:00:00.000Z" },
  "ঘরে-বাইরে": { reelUrl: "https://www.instagram.com/reel/DbVdKYygFzu/", publishedAt: "2026-07-28T00:00:00.000Z" },
  "কপালকুণ্ডলা": { reelUrl: "https://www.instagram.com/reel/DbYKScqAyXg/", publishedAt: "2026-07-29T00:00:00.000Z" },
  "কপালকুন্ডলা": { reelUrl: "https://www.instagram.com/reel/DbYKScqAyXg/", publishedAt: "2026-07-29T00:00:00.000Z" },
  "পদ্মা-নদীর-মাঝি": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DbnWzEngeuK/", publishedAt: "2026-08-04T00:00:00.000Z" },
  "frankenstein": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/Dbqe-LmACcl/", publishedAt: "2026-08-05T00:00:00.000Z" },
  "ক্ষুদিরাম-বসু": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/Db5q8YKAjQc/", publishedAt: "2026-08-11T00:00:00.000Z" },
  "চিত্ত-যেথা-ভয়-শুন্য": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/Db8gHrhNLUc/", publishedAt: "2026-08-12T00:00:00.000Z" },
  "চিত্ত-যেথা-ভয়-শূন্য": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/Db8gHrhNLUc/", publishedAt: "2026-08-12T00:00:00.000Z" },
  "চিত্ত-যেথা-ভয়-শুন্য": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/Db8gHrhNLUc/", publishedAt: "2026-08-12T00:00:00.000Z" },
  "চিত্ত-যেথা-ভয়-শূন্য": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/Db8gHrhNLUc/", publishedAt: "2026-08-12T00:00:00.000Z" },
  "চিত্ত যেথা ভয় শুন্য": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/Db8gHrhNLUc/", publishedAt: "2026-08-12T00:00:00.000Z" },
  "চিত্ত যেথা ভয় শূন্য": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/Db8gHrhNLUc/", publishedAt: "2026-08-12T00:00:00.000Z" },
  "চিত্ত যেথা ভয়শূন্য": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/Db8gHrhNLUc/", publishedAt: "2026-08-12T00:00:00.000Z" },
  "চিত্ত যেথা ভয়শূন্য": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/Db8gHrhNLUc/", publishedAt: "2026-08-12T00:00:00.000Z" },
  "গগনেন্দ্রনাথ-ঠাকুর": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcOZCMTAgyC/", publishedAt: "2026-08-19T00:00:00.000Z" },

  // Alaler Ghorer Dulal
  "আলালের-ঘরের-দুলাল-1": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcTvo9Qsxkj/", publishedAt: "2026-08-21T00:00:00.000Z" },
  "আলালের ঘরের দুলাল - পর্ব-১": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcTvo9Qsxkj/", publishedAt: "2026-08-21T00:00:00.000Z" },
  "আলালের ঘরের দুলাল | পর্ব-১": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcTvo9Qsxkj/", publishedAt: "2026-08-21T00:00:00.000Z" },
  "আলালের ঘরের দুলাল": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcTvo9Qsxkj/", publishedAt: "2026-08-21T00:00:00.000Z" },
  "আলালের-ঘরের-দুলাল-2": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcWRlfxADPL/", publishedAt: "2026-08-22T00:00:00.000Z" },
  "আলালের ঘরের দুলাল - পর্ব-২": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcWRlfxADPL/", publishedAt: "2026-08-22T00:00:00.000Z" },
  "আলালের ঘরের দুলাল | পর্ব-২": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcWRlfxADPL/", publishedAt: "2026-08-22T00:00:00.000Z" },
  "আলালের-ঘরের-দুলাল-3": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcY0U27gN0h/", publishedAt: "2026-08-23T00:00:00.000Z" },
  "আলালের ঘরের দুলাল - অন্তিম পর্ব": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcY0U27gN0h/", publishedAt: "2026-08-23T00:00:00.000Z" },
  "আলালের ঘরের দুলাল | অন্তিম পর্ব": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcY0U27gN0h/", publishedAt: "2026-08-23T00:00:00.000Z" },

  // Kamalakanta's Daptar
  "কমলাকান্তের-দপ্তর-1": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcltCHMg8Xg/", publishedAt: "2026-08-28T00:00:00.000Z" },
  "কমলাকান্তের দপ্তর পর্ব -১": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcltCHMg8Xg/", publishedAt: "2026-08-28T00:00:00.000Z" },
  "কমলাকান্তের দপ্তর পর্ব -১ ": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcltCHMg8Xg/", publishedAt: "2026-08-28T00:00:00.000Z" },
  "কমলাকান্তের দপ্তর - পর্ব-১": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcltCHMg8Xg/", publishedAt: "2026-08-28T00:00:00.000Z" },
  "কমলাকান্তের দপ্তর | পর্ব-১": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcltCHMg8Xg/", publishedAt: "2026-08-28T00:00:00.000Z" },
  "কমলাকান্তের দপ্তর": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcltCHMg8Xg/", publishedAt: "2026-08-28T00:00:00.000Z" },
  "কমলাকান্তের-দপ্তর-2": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcoQ5R1AMgU/", publishedAt: "2026-08-29T00:00:00.000Z" },
  "কমলাকান্তের দপ্তর পর্ব-২": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcoQ5R1AMgU/", publishedAt: "2026-08-29T00:00:00.000Z" },
  "কমলাকান্তের দপ্তর | পর্ব-২": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcoQ5R1AMgU/", publishedAt: "2026-08-29T00:00:00.000Z" },
  "কমলাকান্তের দপ্তর - পর্ব-২": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcoQ5R1AMgU/", publishedAt: "2026-08-29T00:00:00.000Z" },
  "কমলাকান্তের-দপ্তর-3": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/Dcq1r4VA02G/", publishedAt: "2026-08-30T00:00:00.000Z" },
  "কমলাকান্তের দপ্তর অন্তিম পর্ব": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/Dcq1r4VA02G/", publishedAt: "2026-08-30T00:00:00.000Z" },
  "কমলাকান্তের দপ্তর | অন্তিম পর্ব": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/Dcq1r4VA02G/", publishedAt: "2026-08-30T00:00:00.000Z" },

  // Solos
  "তিতুমীর-মহাশ্বেতা-দেবী": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcbZ5mBARfL/", publishedAt: "2026-08-24T00:00:00.000Z" },
  "তিতুমীর- মহাশ্বেতা দেবী": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcbZ5mBARfL/", publishedAt: "2026-08-24T00:00:00.000Z" },
  "তিতুমীর - মহাশ্বেতা দেবী": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcbZ5mBARfL/", publishedAt: "2026-08-24T00:00:00.000Z" },
  "তিতুমীর": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcbZ5mBARfL/", publishedAt: "2026-08-24T00:00:00.000Z" },
  "ইন্দুবালা-ও-আইনস্টাইন": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcgifUQAoFJ/", publishedAt: "2026-08-26T00:00:00.000Z" },
  "ইন্দুবালা ও আইনস্টাইন": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcgifUQAoFJ/", publishedAt: "2026-08-26T00:00:00.000Z" },
  "আইনস্টাইন ও ইন্দুবালা": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcgifUQAoFJ/", publishedAt: "2026-08-26T00:00:00.000Z" },
  "আইনস্টাইন-ও-ইন্দুবালা": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcgifUQAoFJ/", publishedAt: "2026-08-26T00:00:00.000Z" },
  "ভুত-ভবিষ্যৎ": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcjPj8rggqb/", publishedAt: "2026-08-27T00:00:00.000Z" },
  "ভুত ভবিষ্যৎ": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcjPj8rggqb/", publishedAt: "2026-08-27T00:00:00.000Z" },
  "ভুত ভবিষ্যৎ - শরদিন্দু বন্দ্যোপাধ্যায়": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcjPj8rggqb/", publishedAt: "2026-08-27T00:00:00.000Z" },
  "ভূত-ভবিষ্যৎ": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcjPj8rggqb/", publishedAt: "2026-08-27T00:00:00.000Z" },
  "ভূত ভবিষ্যৎ": { reelUrl: "https://www.instagram.com/thoughts.whatever_/reel/DcjPj8rggqb/", publishedAt: "2026-08-27T00:00:00.000Z" },
};

export const ENGLISH_TITLES: Record<string, string> = {
  "আলালের-ঘরের-দুলাল-1": "Alaler Gharer Dulal — Part 1",
  "আলালের-ঘরের-দুলাল-2": "Alaler Gharer Dulal — Part 2",
  "আলালের-ঘরের-দুলাল-3": "Alaler Gharer Dulal — Final Part",
  "কমলাকান্তের-দপ্তর-1": "Kamalakanta's Daptar — Part 1",
  "কমলাকান্তের-দপ্তর-2": "Kamalakanta's Daptar — Part 2",
  "কমলাকান্তের-দপ্তর-3": "Kamalakanta's Daptar — Final Part",
  "ইন্দুবালা-ও-আইনস্টাইন": "Indubala and Einstein",
  "তিতুমীর-মহাশ্বেতা-দেবী": "Titumir — Mahasweta Devi",
  "ভুত-ভবিষ্যৎ": "Bhoot Bhobishyot",
  "গগনেন্দ্রনাথ-ঠাকুর": "Gaganendranath Tagore",
};

function englishTitle(slug: string, existing?: string | null): string | null {
  return ENGLISH_TITLES[slug] || (existing && !/[\u0980-\u09ff]/.test(existing) ? existing : null);
}

function publicationReviewStatus(date: Date): "published" | "scheduled" {
  return date.getTime() > Date.now() ? "scheduled" : "published";
}

/**
 * Compress image using sharp (1600px width max WebP) then upload to Cloudinary CDN.
 * Upload to durable storage; never write a base64 image URL to content.
 */
async function uploadImage(imagePath: string, folderName = "thoughts-whatever"): Promise<{ url: string; width: number; height: number } | null> {
  if (!fs.existsSync(imagePath)) return null;

  try {
    const rawBuffer = fs.readFileSync(imagePath);
    const metadata = await sharp(rawBuffer).metadata();
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
        uploadedImageDetails.set(result.secure_url, {
          width: result.width || metadata.width || 1200,
          height: result.height || metadata.height || 630,
          sizeBytes: result.bytes || optimizedBuffer.length,
        });
        return {
          url: result.secure_url,
          width: result.width || metadata.width || 1200,
          height: result.height || metadata.height || 630,
        };
      } catch (err) {
        throw new Error(`Cloudinary upload failed for ${imagePath}: ${String(err)}`);
      }
    }
    throw new Error("Cloudinary credentials are required for content images");
  } catch (err) {
    throw err;
  }
}

/**
 * Find matching thumbnail file in Thumbnail directory for an episode.
 */
function findThumbnail(thumbnailDir: string, episodeBaseName: string): string | null {
  if (!fs.existsSync(thumbnailDir)) return null;

  const validExts = [".png", ".jpg", ".jpeg", ".webp"];
  const files = fs.readdirSync(thumbnailDir);

  function cleanStr(s: string): string {
    return s
      .toLowerCase()
      .replace(/[\u200B-\u200D\uFEFF]/g, "")
      .replace(/\s*-\s*landscape\b/i, "")
      .replace(/\s*landscape\b/i, "")
      .replace(/\s*ln\b/i, "")
      .replace(/\bpng\b/i, "")
      .replace(/[.\-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  const normalizedTarget = cleanStr(episodeBaseName);

  // Exact cleaned match
  for (const file of files) {
    const ext = path.extname(file);
    if (!validExts.includes(ext.toLowerCase())) continue;

    const base = cleanStr(path.basename(file, ext));
    if (base === normalizedTarget) {
      return path.join(thumbnailDir, file);
    }
  }

  // Soft fallback: prefix or substring match
  for (const file of files) {
    const ext = path.extname(file);
    if (!validExts.includes(ext.toLowerCase())) continue;
    const base = cleanStr(path.basename(file, ext));
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
    let author = await prisma.author.findFirst({ where: { slug: "বঙ্কিমচন্দ্র-চট্টোপাধ্যায়" } });
    if (!author) {
      author = await prisma.author.create({
        data: {
          nameBn: "বঙ্কিমচন্দ্র চট্টোপাধ্যায়",
          nameEn: "Bankim Chandra Chattopadhyay",
          slug: "বঙ্কিমচন্দ্র-চট্টোপাধ্যায়",
          bioBn: "বাংলা সাহিত্যের অন্যতম শ্রেষ্ঠ ঔপন্যাসিক ও আধুনিক বাংলা সাহিত্যের পথিকৃৎ।",
        },
      });
    }
    return author;
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
  if (title.includes("পথের দাবী") || title.includes("pather dabi") || title.includes("শরৎচন্দ্র") || title.includes("sarat")) {
    let author = await prisma.author.findFirst({ where: { slug: "শরৎচন্দ্র-চট্টোপাধ্যায়" } });
    if (!author) {
      author = await prisma.author.create({
        data: {
          nameBn: "শরৎচন্দ্র চট্টোপাধ্যায়",
          nameEn: "Sarat Chandra Chattopadhyay",
          slug: "শরৎচন্দ্র-চট্টোপাধ্যায়",
          bioBn: "বাংলা কথাসাহিত্যের অপরাজেয় কথাশিল্পী ও কালজয়ী ঔপন্যাসিক।",
        },
      });
    }
    return author;
  }
  if (title.includes("crime") || title.includes("dostoevsky") || title.includes("punishment")) {
    let author = await prisma.author.findFirst({ where: { slug: "fyodor-dostoevsky" } });
    if (!author) {
      author = await prisma.author.create({
        data: {
          nameBn: "ফিওদর দস্তয়েভস্কি",
          nameEn: "Fyodor Dostoevsky",
          slug: "fyodor-dostoevsky",
          bioBn: "Russian novelist, short story writer, essayist, and philosopher.",
        },
      });
    }
    return author;
  }
  if (title.includes("আলালের ঘরের দুলাল") || title.includes("alal") || title.includes("প্যারীচাঁদ") || title.includes("টেকচাঁদ")) {
    let author = await prisma.author.findFirst({ where: { slug: "প্যারীচাঁদ-মিত্র" } });
    if (!author) {
      author = await prisma.author.create({
        data: {
          nameBn: "প্যারীচাঁদ মিত্র",
          nameEn: "Peary Chand Mitra",
          slug: "প্যারীচাঁদ-মিত্র",
          bioBn: "বাংলা কথাসাহিত্যের প্রথম আধুনিক ঔপন্যাসিক ও 'আলালের ঘরের দুলাল'-এর স্রষ্টা (ছদ্মনাম টেকচাঁদ ঠাকুর)।",
        },
      });
    }
    return author;
  }
  if (title.includes("কমলাকান্তের দপ্তর") || title.includes("কমলাকান্ত") || title.includes("kamalakanta")) {
    let author = await prisma.author.findFirst({ where: { slug: "বঙ্কিমচন্দ্র-চট্টোপাধ্যায়" } });
    if (!author) {
      author = await prisma.author.create({
        data: {
          nameBn: "বঙ্কিমচন্দ্র চট্টোপাধ্যায়",
          nameEn: "Bankim Chandra Chattopadhyay",
          slug: "বঙ্কিমচন্দ্র-চট্টোপাধ্যায়",
          bioBn: "বাংলা সাহিত্যের অন্যতম শ্রেষ্ঠ ঔপন্যাসিক ও আধুনিক বাংলা সাহিত্যের পথিকৃৎ।",
        },
      });
    }
    return author;
  }
  return null;
}

async function findAuthorForSolo(titleBn: string) {
  const t = titleBn.toLowerCase();
  if (t.includes("ঘরে-বাইরে") || t.includes("রক্তকরবী") || t.includes("চিত্ত")) {
    return await prisma.author.findFirst({ where: { slug: "রবীন্দ্রনাথ-ঠাকুর" } });
  }
  if (t.includes("কপালকুন্ডলা") || t.includes("কপালকুণ্ডলা")) {
    let a = await prisma.author.findFirst({ where: { slug: "বঙ্কিমচন্দ্র-চট্টোপাধ্যায়" } });
    if (!a) {
      a = await prisma.author.create({
        data: {
          nameBn: "বঙ্কিমচন্দ্র চট্টোপাধ্যায়",
          nameEn: "Bankim Chandra Chattopadhyay",
          slug: "বঙ্কিমচন্দ্র-চট্টোপাধ্যায়",
          bioBn: "বাংলা সাহিত্যের অন্যতম শ্রেষ্ঠ ঔপন্যাসিক ও আধুনিক বাংলা সাহিত্যের পথিকৃৎ।",
        },
      });
    }
    return a;
  }
  if (t.includes("তিতুমীর") || t.includes("মহাশ্বেতা")) {
    let a = await prisma.author.findFirst({ where: { slug: "মহাশ্বেতা-দেবী" } });
    if (!a) {
      a = await prisma.author.create({
        data: {
          nameBn: "মহাশ্বেতা দেবী",
          nameEn: "Mahasweta Devi",
          slug: "মহাশ্বেতা-দেবী",
          bioBn: "জ্ঞানপীঠ ও পদ্মবিভূষণ প্রাপ্ত বিশিষ্ট ভারতীয় বাঙালি সাহিত্যিক ও মানবাধিকার আন্দোলনকর্মী।",
        },
      });
    }
    return a;
  }
  if (t.trim() === "দেবী" || t.startsWith("দেবী ") || t.startsWith("দেবী.")) {
    let a = await prisma.author.findFirst({ where: { slug: "শরৎচন্দ্র-চট্টোপাধ্যায়" } });
    if (!a) {
      a = await prisma.author.create({
        data: {
          nameBn: "শরৎচন্দ্র চট্টোপাধ্যায়",
          nameEn: "Sarat Chandra Chattopadhyay",
          slug: "শরৎচন্দ্র-চট্টোপাধ্যায়",
          bioBn: "বাংলা কথাসাহিত্যের অপরাজেয় কথাশিল্পী ও কালজয়ী ঔপন্যাসিক।",
        },
      });
    }
    return a;
  }
  if (t.includes("পদ্মা নদীর মাঝি")) {
    let a = await prisma.author.findFirst({ where: { slug: "মানিক-বন্দ্যোপাধ্যায়" } });
    if (!a) {
      a = await prisma.author.create({
        data: {
          nameBn: "মানিক বন্দ্যোপাধ্যায়",
          nameEn: "Manik Bandyopadhyay",
          slug: "মানিক-বন্দ্যোপাধ্যায়",
          bioBn: "আধুনিক বাংলা কথাসাহিত্যের অন্যতম প্রধান ঔপন্যাসিক ও বাস্তববাদী কথাসাহিত্যিক।",
        },
      });
    }
    return a;
  }
  if (t.includes("frankenstein") || t.includes("ফ্রাঙ্কেনস্টাইন")) {
    let a = await prisma.author.findFirst({ where: { slug: "mary-shelley" } });
    if (!a) {
      a = await prisma.author.create({
        data: {
          nameBn: "মেরি শেলি",
          nameEn: "Mary Shelley",
          slug: "mary-shelley",
          bioBn: "English novelist best known for her iconic Gothic masterpiece Frankenstein.",
        },
      });
    }
    return a;
  }
  if (t.includes("ক্ষুদিরাম")) {
    let a = await prisma.author.findFirst({ where: { slug: "পীতাম্বর-দাস" } });
    if (!a) {
      a = await prisma.author.create({
        data: {
          nameBn: "পীতাম্বর দাস",
          nameEn: "Pitambar Das",
          slug: "পীতাম্বর-দাস",
          bioBn: "কালজয়ী দেশাত্মবোধক গান 'একবার বিদায় দে মা ঘুরে আসি'-র রচয়িতা ও চারণকবি।",
        },
      });
    }
    return a;
  }
  if (t.includes("ইন্দুবালা") || t.includes("আইনস্টাইন") || t.includes("বিভূতিভূষণ") || t.includes("বিভূতি")) {
    let a = await prisma.author.findFirst({ where: { slug: "বিভূতিভূষণ-বন্দ্যোপাধ্যায়" } });
    if (!a) {
      a = await prisma.author.create({
        data: {
          nameBn: "বিভূতিভূষণ বন্দ্যোপাধ্যায়",
          nameEn: "Bibhutibhushan Bandyopadhyay",
          slug: "বিভূতিভূষণ-বন্দ্যোপাধ্যায়",
          bioBn: "বাংলা সাহিত্যের কালজয়ী কথাসাহিত্যিক, 'পথের পাঁচালী' ও 'আরণ্যক'-এর রচয়িতা।",
        },
      });
    }
    return a;
  }
  if (t.includes("ভুত ভবিষ্যৎ") || t.includes("ভূত ভবিষ্যৎ") || t.includes("শরদিন্দু")) {
    let a = await prisma.author.findFirst({ where: { slug: "শরদিন্দু-বন্দ্যোপাধ্যায়" } });
    if (!a) {
      a = await prisma.author.create({
        data: {
          nameBn: "শরদিন্দু বন্দ্যোপাধ্যায়",
          nameEn: "Saradindu Bandyopadhyay",
          slug: "শরদিন্দু-বন্দ্যোপাধ্যায়",
          bioBn: "বাংলা সাহিত্যের অন্যতম জনপ্রিয় লেখক, ঐতিহাসিক উপন্যাস এবং গোয়েন্দা ব্যোমকেশ বক্সীর স্রষ্টা।",
        },
      });
    }
    return a;
  }
  if (t.includes("গগনেন্দ্রনাথ")) {
    let a = await prisma.author.findFirst({ where: { slug: "গগনেন্দ্রনাথ-ঠাকুর" } });
    if (!a) {
      a = await prisma.author.create({
        data: {
          nameBn: "গগনেন্দ্রনাথ ঠাকুর",
          nameEn: "Gaganendranath Tagore",
          slug: "গগনেন্দ্রনাথ-ঠাকুর",
          bioBn: "আধুনিক ভারতীয় চিত্রকলার অন্যতম পথিকৃৎ ও বিখ্যাত ব্যঙ্গচিত্রশিল্পী।",
        },
      });
    }
    return a;
  }
  return null;
}

async function main(options?: { force?: boolean }) {
  console.log("🚀 Thoughts Whatever — Content Automation Engine Starting...\n");
  const isForce = options?.force ?? process.argv.includes("--force");
  const onlyIndex = process.argv.indexOf("--only");
  const onlyTitle = onlyIndex >= 0 ? process.argv[onlyIndex + 1] : undefined;
  if (onlyIndex >= 0 && !onlyTitle) throw new Error("--only requires a content title");

  const contentBaseDir = path.join(process.cwd(), "Content");
  const contextBaseDir = path.join(contentBaseDir, "context");
  const thumbnailBaseDir = path.join(contentBaseDir, "Thumnail"); // handling folder name

  if (!fs.existsSync(contextBaseDir)) {
    console.error(`❌ Context directory not found at ${contextBaseDir}`);
    process.exit(1);
  }

  const seriesFolderSet = new Set<string>();
  if (fs.existsSync(contextBaseDir)) {
    fs.readdirSync(contextBaseDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .forEach((d) => seriesFolderSet.add(d.name));
  }

  const ignoredRootDirs = new Set(["context", "thumnail", "thumbnail", "docs", "solo", "archive", "temp"]);
  const rootDirs = fs
    .readdirSync(contentBaseDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !ignoredRootDirs.has(d.name.toLowerCase()));

  for (const rDir of rootDirs) {
    const matched = Array.from(seriesFolderSet).find((f) => f.toLowerCase() === rDir.name.toLowerCase());
    if (!matched) {
      seriesFolderSet.add(rDir.name);
    }
  }

  const seriesFolders = Array.from(seriesFolderSet);

  if (seriesFolders.length === 0) {
    console.log("ℹ️ No series folders found inside Content/context/ or Content/");
    process.exit(0);
  }

  for (const folderName of (onlyTitle ? [] : seriesFolders)) {
    const contextSeriesDir = fs.existsSync(path.join(contextBaseDir, folderName))
      ? path.join(contextBaseDir, folderName)
      : path.join(contentBaseDir, folderName);

    let thumbnailSeriesDir = path.join(thumbnailBaseDir, folderName);
    const landscapeThumbnailBaseDir = path.join(contentBaseDir, "Thumnail Landscape");
    let landscapeSeriesDir = path.join(landscapeThumbnailBaseDir, folderName);

    if (!fs.existsSync(thumbnailSeriesDir)) {
      const cleanName = folderName.replace(/\s*-\s*[^\n]+$/i, "").replace(/\s*Series\s*$/i, "").trim();
      const altThumb = path.join(thumbnailBaseDir, cleanName);
      if (fs.existsSync(altThumb)) {
        thumbnailSeriesDir = altThumb;
      }
    }

    if (!fs.existsSync(landscapeSeriesDir)) {
      const cleanName = folderName.replace(/\s*-\s*[^\n]+$/i, "").replace(/\s*Series\s*$/i, "").trim();
      const altLandscape = path.join(landscapeThumbnailBaseDir, cleanName);
      if (fs.existsSync(altLandscape)) {
        landscapeSeriesDir = altLandscape;
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

    // Find series cover thumbnail and banner if available
    const seriesCoverPath = findThumbnail(thumbnailSeriesDir, cleanSeriesTitle) ||
      findThumbnail(thumbnailSeriesDir, `${cleanSeriesTitle} 1`) ||
      findThumbnail(thumbnailSeriesDir, `${cleanSeriesTitle} - পর্ব-১`) ||
      findThumbnail(thumbnailSeriesDir, `${cleanSeriesTitle} পর্ব -১`) ||
      findThumbnail(thumbnailSeriesDir, `${cleanSeriesTitle} cover`);
    const seriesBannerPath = findThumbnail(landscapeSeriesDir, cleanSeriesTitle) ||
      findThumbnail(landscapeSeriesDir, `${cleanSeriesTitle} 1`) ||
      findThumbnail(landscapeSeriesDir, `${cleanSeriesTitle} - পর্ব-১`) ||
      findThumbnail(landscapeSeriesDir, `${cleanSeriesTitle} পর্ব -১`) ||
      findThumbnail(landscapeSeriesDir, `${cleanSeriesTitle} banner`);

    if (!series) {
      console.log(`  ✨ Creating new Series: "${cleanSeriesTitle}"...`);
      const seriesAiMeta = await generateSeriesMetadata(cleanSeriesTitle, sampleText);
      const seriesCover = seriesCoverPath ? await uploadImage(seriesCoverPath, "series-covers") : null;
      const seriesBanner = seriesBannerPath ? await uploadImage(seriesBannerPath, "series-banners") : null;

      series = await prisma.series.create({
        data: {
          slug: seriesSlug,
          titleBn: cleanSeriesTitle,
          titleEn: seriesAiMeta.titleEn,
          descBn: seriesAiMeta.descBn,
          coverImage: seriesCover?.url,
          bannerImage: seriesBanner?.url,
        },
      });
      console.log(`  ✅ Series Created: ID ${series.id} (slug: ${series.slug})`);
    } else {
      console.log(`  ℹ️ Found existing Series: ID ${series.id} (slug: ${series.slug})`);
      if (!series.coverImage && seriesCoverPath) {
        const seriesCover = await uploadImage(seriesCoverPath, "series-covers");
        if (seriesCover) {
          series = await prisma.series.update({
            where: { id: series.id },
            data: { coverImage: seriesCover.url },
          });
          console.log(`  🖼️ Updated Series cover image for ${series.titleBn}`);
        }
      }
      if (!series.bannerImage && seriesBannerPath) {
        const seriesBanner = await uploadImage(seriesBannerPath, "series-banners");
        if (seriesBanner) {
          series = await prisma.series.update({
            where: { id: series.id },
            data: { bannerImage: seriesBanner.url },
          });
          console.log(`  🖼️ Updated Series banner image for ${series.titleBn}`);
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

      // Generate standard SEO URL slug & Clean Title
      let pieceSlug = `${seriesSlug}-${episodeNumber}`;
      let formattedTitleBn = fileBaseName.trim();
      if (episodeNumber === 1 && (!formattedTitleBn.includes("|") || !formattedTitleBn.includes("পর্ব"))) {
        formattedTitleBn = cleanSeriesTitle;
      } else if (episodeNumber === 2 && !formattedTitleBn.includes("|")) {
        formattedTitleBn = `${cleanSeriesTitle} | পর্ব-২`;
      } else if (episodeNumber === 3 && (formattedTitleBn.includes("অন্তিম") || !formattedTitleBn.includes("|"))) {
        formattedTitleBn = `${cleanSeriesTitle} | অন্তিম পর্ব`;
      }

      // Check if piece already exists by slug or (seriesId + seriesOrder)
      let existingPiece = await prisma.piece.findFirst({
        where: {
          OR: [
            { slug: pieceSlug },
            { AND: [{ seriesId: series.id }, { seriesOrder: episodeNumber }] },
          ],
        },
      });

      const known = KNOWN_REEL_METADATA[pieceSlug] || KNOWN_REEL_METADATA[formattedTitleBn] || KNOWN_REEL_METADATA[fileBaseName];
      const reelUrl = known?.reelUrl || existingPiece?.reelUrl;
      const targetPublishedAt = known ? new Date(known.publishedAt) : (existingPiece?.publishedAt || new Date());

      if (existingPiece && !isForce) {
        console.log(`  ℹ️ Episode #${episodeNumber} already exists (${existingPiece.slug}). Updating metadata if needed...`);
        let coverUrl = existingPiece.coverImage;
        let thumbUrl = existingPiece.thumbnailImage;
        if (!coverUrl) {
          const thumbnailPath = findThumbnail(thumbnailSeriesDir, fileBaseName);
          if (thumbnailPath) {
            const uploaded = await uploadImage(thumbnailPath, `episodes/${seriesSlug}`);
            if (uploaded) coverUrl = uploaded.url;
          }
        }
        if (!thumbUrl) {
          const landscapePath = findThumbnail(landscapeSeriesDir, fileBaseName);
          if (landscapePath) {
            const uploaded = await uploadImage(landscapePath, `episodes/${seriesSlug}`);
            if (uploaded) thumbUrl = uploaded.url;
          }
        }
        await prisma.piece.update({
          where: { id: existingPiece.id },
          data: {
            reelUrl,
            publishedAt: targetPublishedAt,
            reviewStatus: publicationReviewStatus(targetPublishedAt),
            coverImage: coverUrl,
            thumbnailImage: thumbUrl,
            ogImage: thumbUrl || coverUrl || existingPiece.ogImage,
          },
        });
        continue;
      }

      console.log(`\n  📝 STEP 1: Reading Context File: "${file}"...`);
      const rawText = fs.readFileSync(filePath, "utf-8");

      console.log(`  🎨 STEP 2: Inspecting & Locating Thumbnails (Portrait & Landscape)...`);
      const thumbnailPath = findThumbnail(thumbnailSeriesDir, fileBaseName);
      const landscapePath = findThumbnail(landscapeSeriesDir, fileBaseName);
      let coverImageRes: { url: string; width: number; height: number } | null = null;
      let landscapeImageRes: { url: string; width: number; height: number } | null = null;

      if (thumbnailPath) {
        console.log(`    Found thumbnail: ${path.basename(thumbnailPath)}`);
        coverImageRes = await uploadImage(thumbnailPath, `episodes/${seriesSlug}`);
      } else {
        console.warn(`    ⚠️ Thumbnail not found for ${fileBaseName} in ${thumbnailSeriesDir}`);
      }

      if (landscapePath) {
        console.log(`    Found landscape thumbnail: ${path.basename(landscapePath)}`);
        landscapeImageRes = await uploadImage(landscapePath, `episodes/${seriesSlug}`);
      } else {
        console.warn(`    ⚠️ Landscape thumbnail not found for ${fileBaseName} in ${landscapeSeriesDir}`);
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

      const author = await findAuthorForSeries(cleanSeriesTitle);
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thoughts-whatever.vercel.app";
      const fullUrl = `${baseUrl}/writing/${pieceSlug}`;

      let piece;
      if (existingPiece) {
        console.log(`  🔄 Updating existing Episode #${episodeNumber} (ID: ${existingPiece.id})...`);
        piece = await prisma.piece.update({
          where: { id: existingPiece.id },
          data: {
            kind,
            status: "PUBLISHED",
            reviewStatus: publicationReviewStatus(targetPublishedAt),
            slug: pieceSlug,
            titleBn: formattedTitleBn,
            titleEn: englishTitle(pieceSlug, existingPiece.titleEn),
            bodyBn: formattedBody,
            excerptBn: epAiMeta.excerpt || deriveExcerpt(formattedBody),
            coverImage: coverImageRes?.url || existingPiece.coverImage,
            coverImageWidth: coverImageRes?.width || existingPiece.coverImageWidth,
            coverImageHeight: coverImageRes?.height || existingPiece.coverImageHeight,
            thumbnailImage: landscapeImageRes?.url || existingPiece.thumbnailImage,
            readingMinutes: readingMins,
            featured: true, // Show on landing page
            seoDescription: epAiMeta.seoDescription,
            ogImage: landscapeImageRes?.url || coverImageRes?.url || existingPiece.ogImage,
            reelUrl,
            publishedAt: targetPublishedAt,
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
            reviewStatus: publicationReviewStatus(targetPublishedAt),
            slug: pieceSlug,
            titleBn: formattedTitleBn,
            titleEn: englishTitle(pieceSlug),
            bodyBn: formattedBody,
            excerptBn: epAiMeta.excerpt || deriveExcerpt(formattedBody),
            coverImage: coverImageRes?.url,
            coverImageWidth: coverImageRes?.width,
            coverImageHeight: coverImageRes?.height,
            thumbnailImage: landscapeImageRes?.url,
            readingMinutes: readingMins,
            featured: true, // Show on landing page
            seoDescription: epAiMeta.seoDescription,
            ogImage: landscapeImageRes?.url || coverImageRes?.url,
            reelUrl,
            publishedAt: targetPublishedAt,
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
  const soloLandscapeDir = path.join(process.cwd(), "Content", "Thumnail Landscape", "Solo");

  if (fs.existsSync(soloBaseDir)) {
    const soloFiles = fs
      .readdirSync(soloBaseDir)
      .filter((file) => (file.endsWith(".txt") || file.endsWith(".md")) && !file.endsWith(".social.md"))
      .filter((file) => !onlyTitle || path.basename(file, path.extname(file)) === onlyTitle);
    if (onlyTitle && soloFiles.length === 0) throw new Error(`No solo content found for ${onlyTitle}`);

    for (const file of soloFiles) {
      const filePath = path.join(soloBaseDir, file);
      const titleBn = path.basename(file, path.extname(file));
      const slug = bengaliSlug(titleBn);

      const existingPiece = await prisma.piece.findUnique({ where: { slug }, include: { authors: true } });
      const knownSolo = KNOWN_REEL_METADATA[slug] || KNOWN_REEL_METADATA[titleBn];
      const soloReelUrl = knownSolo?.reelUrl || existingPiece?.reelUrl;
      const soloPublishedAt = knownSolo ? new Date(knownSolo.publishedAt) : (existingPiece?.publishedAt || new Date());

      if (existingPiece && !isForce) {
        console.log(`  ℹ️ Solo Article "${titleBn}" (${slug}) already exists. Updating metadata if needed...`);
        let coverUrl = existingPiece.coverImage;
        let thumbUrl = existingPiece.thumbnailImage;
        if (!coverUrl) {
          const coverPath = findThumbnail(soloThumbnailDir, titleBn);
          if (coverPath) {
            const uploaded = await uploadImage(coverPath, "piece-covers");
            if (uploaded) coverUrl = uploaded.url;
          }
        }
        if (!thumbUrl) {
          const landscapePath = findThumbnail(soloLandscapeDir, titleBn);
          if (landscapePath) {
            const uploaded = await uploadImage(landscapePath, "landscape-thumbnails");
            if (uploaded) thumbUrl = uploaded.url;
          }
        }
        await prisma.piece.update({
          where: { id: existingPiece.id },
          data: {
            reelUrl: soloReelUrl,
            publishedAt: soloPublishedAt,
            reviewStatus: publicationReviewStatus(soloPublishedAt),
            coverImage: coverUrl,
            thumbnailImage: thumbUrl,
            ogImage: thumbUrl || coverUrl || existingPiece.ogImage,
          },
        });
        continue;
      }

      console.log(`\n📄 Processing Solo Article: "${file}" -> Title: "${titleBn}" (slug: ${slug})`);

      const rawContent = fs.readFileSync(filePath, "utf-8");
      const formattedBody = await formatArticleBody(rawContent, titleBn);
      const epAiMeta = await generateEpisodeMetadata(titleBn, titleBn, formattedBody, 1);

      const coverPath = findThumbnail(soloThumbnailDir, titleBn);
      const coverImageRes = existingPiece?.coverImage ? { url: existingPiece.coverImage, width: existingPiece.coverImageWidth || 0, height: existingPiece.coverImageHeight || 0 } : coverPath ? await uploadImage(coverPath, "piece-covers") : null;
      const landscapePath = findThumbnail(soloLandscapeDir, titleBn);
      const landscapeImageRes = existingPiece?.thumbnailImage ? { url: existingPiece.thumbnailImage } : landscapePath ? await uploadImage(landscapePath, "landscape-thumbnails") : null;
      if (onlyTitle && (!coverImageRes?.url || !landscapeImageRes?.url || coverImageRes.url.startsWith("data:") || landscapeImageRes.url.startsWith("data:"))) {
        throw new Error("Both portrait and landscape images must upload to Cloudinary before publishing");
      }

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

      const soloAuthor = await findAuthorForSolo(titleBn);

      const pieceData = {
        titleBn,
        titleEn: englishTitle(slug, existingPiece?.titleEn),
        bodyBn: formattedBody,
        excerptBn: epAiMeta.excerpt || deriveExcerpt(formattedBody),
        coverImage: coverImageRes?.url || existingPiece?.coverImage,
        coverImageWidth: coverImageRes?.width || existingPiece?.coverImageWidth,
        coverImageHeight: coverImageRes?.height || existingPiece?.coverImageHeight,
        thumbnailImage: landscapeImageRes?.url || existingPiece?.thumbnailImage,
        readingMinutes: readingMins,
        featured: true,
        seoDescription: epAiMeta.seoDescription,
        ogImage: landscapeImageRes?.url || coverImageRes?.url || existingPiece?.ogImage,
        reelUrl: soloReelUrl,
        publishedAt: soloPublishedAt,
        reviewStatus: publicationReviewStatus(soloPublishedAt),
        tags: { connect: tagIds.map((id) => ({ id })) },
        authors: soloAuthor ? { connect: [{ id: soloAuthor.id }] } : undefined,
      };

      if (existingPiece) {
        await prisma.piece.update({
          where: { id: existingPiece.id },
          data: {
            titleBn,
            titleEn: englishTitle(slug, existingPiece.titleEn),
            bodyBn: formattedBody,
            excerptBn: epAiMeta.excerpt || deriveExcerpt(formattedBody),
            coverImage: coverImageRes?.url || existingPiece.coverImage,
            coverImageWidth: coverImageRes?.width || existingPiece.coverImageWidth,
            coverImageHeight: coverImageRes?.height || existingPiece.coverImageHeight,
            thumbnailImage: landscapeImageRes?.url || existingPiece.thumbnailImage,
            readingMinutes: readingMins,
            featured: true,
            seoDescription: epAiMeta.seoDescription,
            ogImage: landscapeImageRes?.url || coverImageRes?.url || existingPiece.ogImage,
            reelUrl: soloReelUrl,
            publishedAt: soloPublishedAt,
            reviewStatus: publicationReviewStatus(soloPublishedAt),
            kind: PieceKind.DOCUMENTARY,
            authors: soloAuthor ? { set: [{ id: soloAuthor.id }] } : undefined,
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

      // Generate & Save Social Captions
      console.log(`  📱 Generating Social Media Captions for "${titleBn}"...`);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://thoughts-whatever.vercel.app";
        const fullUrl = `${baseUrl}/documentary/${slug}`;
        const socialCaptions = await generateSocialCaptions(
          "Solo",
          titleBn,
          epAiMeta.excerpt,
          epAiMeta.quote,
          fullUrl
        );
        const socialFile = saveSocialCaptions(filePath, socialCaptions, titleBn, "Solo");
        console.log(`    Saved captions to: ${path.basename(socialFile)}`);
      } catch (err) {
        console.warn("  ⚠️ Could not generate social captions:", err);
      }
    }
  }

  console.log("\n🎉 ALL CONTENT PROCESSED SUCCESSFULLY!");
  const mediaSync = await syncAllMediaUsage();
  for (const [url, details] of uploadedImageDetails) {
    await prisma.media.updateMany({
      where: { url },
      data: {
        width: details.width,
        height: details.height,
        sizeBytes: details.sizeBytes,
      },
    });
  }
  console.log(`  Media library: ${mediaSync.createdCount} new assets, ${mediaSync.linkedCount} usage links`);
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
