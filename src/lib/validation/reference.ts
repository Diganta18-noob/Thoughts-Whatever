import { z } from "zod";
import {
  ReferenceType,
  ReferenceLanguage,
  ReferenceRightsStatus,
  ReferenceHostingMode,
  ReferenceAssetKind,
  TakedownStatus,
} from "@prisma/client";

const BENGALI_BLOCK = "\\u0980-\\u09FF";
const SLUG_RE = new RegExp(`^[${BENGALI_BLOCK}a-z0-9-]+$`);

export const referenceWorkInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1, "স্লাগ দিতে হবে")
    .max(160)
    .regex(SLUG_RE, "স্লাগে শুধু বাংলা অক্ষর, ইংরেজি ছোট হাতের অক্ষর, সংখ্যা ও হাইফেন চলবে"),
  titleBn: z.string().trim().min(1, "বাংলা শিরোনাম আবশ্যক"),
  titleEn: z.string().trim().optional().nullable(),
  subtitleBn: z.string().trim().optional().nullable(),
  descriptionBn: z.string().trim().optional().nullable(),
  descriptionEn: z.string().trim().optional().nullable(),
  type: z.nativeEnum(ReferenceType).default(ReferenceType.BOOK),
  language: z.nativeEnum(ReferenceLanguage).default(ReferenceLanguage.BENGALI),
  era: z.string().trim().optional().nullable(),
  subject: z.string().trim().optional().nullable(),
  tags: z.array(z.string().trim()).default([]),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  authorId: z.string().trim().optional().nullable(),

  // Initial Edition information (created along with work)
  edition: z
    .object({
      editionTitleBn: z.string().trim().optional().nullable(),
      editor: z.string().trim().optional().nullable(),
      translator: z.string().trim().optional().nullable(),
      publisher: z.string().trim().optional().nullable(),
      publicationYear: z.number().int().optional().nullable(),
      publicationPlace: z.string().trim().optional().nullable(),
      isbn: z.string().trim().optional().nullable(),
      pages: z.number().int().optional().nullable(),
      notes: z.string().trim().optional().nullable(),
      coverImage: z.string().trim().optional().nullable(),
      hostingMode: z
        .nativeEnum(ReferenceHostingMode)
        .default(ReferenceHostingMode.EXTERNAL),
      readerManifest: z.any().optional().nullable(),

      // Source info
      source: z.object({
        sourceName: z.string().trim().min(1, "উৎস বা প্রতিষ্ঠানের নাম আবশ্যক"),
        sourceUrl: z.string().trim().url("সঠিক URL দিন"),
        externalId: z.string().trim().optional().nullable(),
        sourceDescription: z.string().trim().optional().nullable(),
      }),

      // Rights info
      rights: z.object({
        status: z
          .nativeEnum(ReferenceRightsStatus)
          .default(ReferenceRightsStatus.RIGHTS_UNVERIFIED),
        license: z.string().trim().optional().nullable(),
        licenseUrl: z.string().trim().optional().nullable(),
        rightsHolder: z.string().trim().optional().nullable(),
        attribution: z.string().trim().optional().nullable(),
        verificationNotes: z.string().trim().optional().nullable(),
        evidenceUrl: z.string().trim().optional().nullable(),
        permissionDocumentUrl: z.string().trim().optional().nullable(),
      }),
    })
    .optional(),
});

export const referenceRightsReviewInputSchema = z.object({
  newStatus: z.nativeEnum(ReferenceRightsStatus),
  reason: z.string().trim().min(3, "স্বত্ব পরিবর্তনের কারণ উল্লেখ করতে হবে"),
  notes: z.string().trim().optional().nullable(),
  evidenceUrl: z.string().trim().optional().nullable(),
  license: z.string().trim().optional().nullable(),
  rightsHolder: z.string().trim().optional().nullable(),
});

export const referenceAssetInputSchema = z.object({
  kind: z.nativeEnum(ReferenceAssetKind),
  title: z.string().trim().min(1, "ফাইলের শিরোনাম আবশ্যক"),
  fileUrl: z.string().trim().url("ফাইলের সঠিক URL আবশ্যক"),
  mimeType: z.string().trim().optional().nullable(),
  sizeBytes: z.number().int().optional().nullable(),
  durationSec: z.number().int().optional().nullable(),
  transcriptText: z.string().trim().optional().nullable(),
  narrator: z.string().trim().optional().nullable(),
  isDownloadable: z.boolean().default(false),
  isOnlineReadable: z.boolean().default(false),
});

export const referenceTakedownInputSchema = z.object({
  workSlug: z.string().trim().optional().nullable(),
  resourceTitle: z.string().trim().min(1, "সম্পদের শিরোনাম আবশ্যক"),
  claimantName: z.string().trim().min(1, "আপনার নাম আবশ্যক"),
  claimantEmail: z.string().trim().email("সঠিক ইমেইল ঠিকানা আবশ্যক"),
  reason: z.string().trim().min(5, "আপত্তির কারণ বিস্তারিত উল্লেখ করুন"),
  supportingUrl: z.string().trim().url("সঠিক প্রমাণপত্র বা URL আবশ্যক").optional().or(z.literal("")),
  message: z.string().trim().min(10, "আপত্তি বা তথ্যের বিবরণ লিখুন"),
});
