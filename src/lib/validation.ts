import { z } from "zod";

/**
 * Every write to the database is validated here first.
 *
 * Two Bengali-specific things are worth noting. Slugs allow the Bengali block
 * (U+0980–U+09FF) because slugs on this site stay in Bengali rather than being
 * transliterated. And `titleBn`/`bodyBn` are checked for non-whitespace content
 * rather than length alone, since a field holding only a zero-width joiner
 * looks filled in the editor but is empty.
 */

const BENGALI_BLOCK = "\\u0980-\\u09FF";
const SLUG_RE = new RegExp(`^[${BENGALI_BLOCK}a-z0-9-]+$`);

/**
 * Zero-width joiner, non-joiner, space, and BOM — built from codepoints rather
 * than pasted in, because a literal invisible character in source cannot be
 * reviewed in a diff and gets silently eaten by editors.
 */
const ZERO_WIDTH = new RegExp(
  `[${[0x200b, 0x200c, 0x200d, 0xfeff].map((c) => String.fromCharCode(c)).join("")}]`,
  "g",
);

const nonEmpty = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} দিতে হবে`)
    // A field holding only a zero-width joiner looks filled but is empty.
    .refine((v) => v.replace(ZERO_WIDTH, "").trim().length > 0, {
      message: `${label} দিতে হবে`,
    });

const slug = z
  .string()
  .trim()
  .min(1, "স্লাগ দিতে হবে")
  .max(160)
  .regex(SLUG_RE, "স্লাগে শুধু বাংলা অক্ষর, ইংরেজি ছোট হাতের অক্ষর, সংখ্যা ও হাইফেন চলবে");

const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

const optionalUrl = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional()
  .refine((v) => !v || /^https?:\/\//.test(v) || v.startsWith("/"), {
    message: "লিংকটি http(s):// দিয়ে শুরু হতে হবে",
  });

export const pieceKindSchema = z.enum(["RACHANA", "BLOG", "DOCUMENTARY"]);
export const pieceStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
export const tagKindSchema = z.enum(["FORM", "THEME", "ERA", "TOPIC"]);

export const sourceInputSchema = z.object({
  label: nonEmpty("সূত্রের নাম"),
  url: optionalUrl,
  note: optionalText,
});

export const timelineInputSchema = z.object({
  year: nonEmpty("সাল"),
  labelBn: nonEmpty("ঘটনা"),
  descBn: optionalText,
});

export const pieceInputSchema = z.object({
  kind: pieceKindSchema,
  status: pieceStatusSchema,
  slug,
  titleBn: nonEmpty("শিরোনাম"),
  titleEn: optionalText,
  subtitleBn: optionalText,
  dekBn: optionalText,
  bodyBn: nonEmpty("লেখা"),
  excerptBn: optionalText,

  coverImage: optionalUrl,
  reelUrl: optionalUrl,
  videoUrl: optionalUrl,
  audioUrl: optionalUrl,
  audioSec: z.coerce.number().int().min(0).max(60 * 60 * 6).nullable().optional(),

  featured: z.boolean().default(false),
  seoDescription: optionalText,
  ogImage: optionalUrl,

  // Empty string from a date input means "no date"; an explicit date means the
  // publisher chose one, including a future one for scheduling.
  publishedAt: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),

  authorIds: z.array(z.string()).default([]),
  tagIds: z.array(z.string()).default([]),
  seriesId: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .optional(),
  seriesOrder: z.coerce.number().int().min(1).max(999).nullable().optional(),

  sources: z.array(sourceInputSchema).default([]),
  timeline: z.array(timelineInputSchema).default([]),
});

export type PieceInput = z.infer<typeof pieceInputSchema>;

export const authorInputSchema = z.object({
  slug,
  nameBn: nonEmpty("নাম"),
  nameEn: optionalText,
  era: optionalText,
  bioBn: optionalText,
  portrait: optionalUrl,
});

export const tagInputSchema = z.object({
  slug,
  labelBn: nonEmpty("নাম"),
  labelEn: optionalText,
  kind: tagKindSchema.default("TOPIC"),
});

export const seriesInputSchema = z.object({
  slug,
  titleBn: nonEmpty("শিরোনাম"),
  titleEn: optionalText,
  descBn: optionalText,
  coverImage: optionalUrl,
});

export const loginSchema = z.object({
  email: z.email("সঠিক ইমেল দিন"),
  password: z.string().min(8, "পাসওয়ার্ড অন্তত ৮ অক্ষরের হতে হবে"),
});

export const subscribeSchema = z.object({
  email: z.email("সঠিক ইমেল ঠিকানা দিন"),
  nameBn: optionalText,
  source: z.string().trim().max(120).optional(),
});

/** Collapse a ZodError into the shape the admin forms and API replies expect. */
export function flattenIssues(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
