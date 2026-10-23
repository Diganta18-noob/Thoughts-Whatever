import { z } from "zod";
import type { EditorPiece } from "@/components/admin/piece-editor";

const strings = {
  id: z.string(), slug: z.string(), titleBn: z.string(), titleEn: z.string(),
  subtitleBn: z.string(), dekBn: z.string(), bodyBn: z.string(), excerptBn: z.string(),
  coverImage: z.string(), reelUrl: z.string(), videoUrl: z.string(), audioUrl: z.string(),
  audioSec: z.string(), seoDescription: z.string(), ogImage: z.string(),
  publishedAt: z.string(), seriesId: z.string(), seriesOrder: z.string(),
};
const schema = z.object({
  ...strings,
  kind: z.enum(["RACHANA", "BLOG", "DOCUMENTARY"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  featured: z.boolean(), thumbnailImage: z.string().optional(),
  coverImageWidth: z.number().nullable().optional(), coverImageHeight: z.number().nullable().optional(),
  authorIds: z.array(z.string()), tagIds: z.array(z.string()),
  sources: z.array(z.object({ label: z.string(), url: z.string(), note: z.string() })),
  timeline: z.array(z.object({ year: z.string(), labelBn: z.string(), descBn: z.string() })),
});

export function isEditorRecovery(value: unknown): value is EditorPiece {
  return schema.safeParse(value).success;
}
