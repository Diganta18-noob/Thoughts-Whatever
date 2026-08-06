export interface SourceInput {
  label: string;
  url: string;
  note: string;
}

export interface TimelineInput {
  year: string;
  labelBn: string;
  descBn: string;
}

export interface PieceEditorFormState {
  kind: "RACHANA" | "BLOG" | "DOCUMENTARY";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  slug: string;
  titleBn: string;
  titleEn: string;
  subtitleBn: string;
  dekBn: string;
  bodyBn: string;
  excerptBn: string;
  coverImage: string;
  coverImageWidth: number | null;
  coverImageHeight: number | null;
  reelUrl: string;
  videoUrl: string;
  audioUrl: string;
  audioSec: string;
  featured: boolean;
  seoDescription: string;
  ogImage: string;
  publishedAt: string;
  authorIds: string[];
  tagIds: string[];
  seriesId: string;
  seriesOrder: string;
  sources: SourceInput[];
  timeline: TimelineInput[];
}
