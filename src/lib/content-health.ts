import { prisma } from "@/lib/prisma";
import { countBengaliWords } from "@/lib/bengali";

export interface ArticleHealthIssue {
  type: "meta_description" | "cover_image" | "word_count" | "author" | "dek" | "stale" | "tags";
  severity: "critical" | "warning" | "info";
  message: string;
}

export interface ArticleHealthReport {
  id: string;
  slug: string;
  titleBn: string;
  kind: string;
  status: string;
  score: number;
  grade: "healthy" | "needs_attention" | "critical";
  wordCount: number;
  readingMinutes: number;
  hasCoverImage: boolean;
  hasMetaDescription: boolean;
  hasAuthors: boolean;
  hasDek: boolean;
  hasTags: boolean;
  lastUpdatedDaysAgo: number;
  issues: ArticleHealthIssue[];
  updatedAt: string;
}

export interface ContentHealthSummary {
  averageScore: number;
  totalPieces: number;
  healthyCount: number;
  needsAttentionCount: number;
  criticalCount: number;
  topIssues: Array<{ message: string; count: number }>;
  pieces: ArticleHealthReport[];
}

export function evaluatePieceHealth(piece: {
  id: string;
  slug: string;
  titleBn: string;
  titleEn?: string | null;
  subtitleBn?: string | null;
  dekBn?: string | null;
  bodyBn: string;
  excerptBn?: string | null;
  coverImage?: string | null;
  seoDescription?: string | null;
  kind: string;
  status: string;
  readingMinutes: number;
  authors?: Array<{ id: string; nameBn: string }>;
  tags?: Array<{ id: string; labelBn: string }>;
  updatedAt: Date;
}): ArticleHealthReport {
  let score = 100;
  const issues: ArticleHealthIssue[] = [];

  const wordCount = countBengaliWords(piece.bodyBn || "");
  const now = Date.now();
  const updatedMs = new Date(piece.updatedAt).getTime();
  const lastUpdatedDaysAgo = Math.floor((now - updatedMs) / (1000 * 60 * 60 * 24));

  // 1. Title Quality (max -15)
  if (!piece.titleBn || piece.titleBn.trim().length < 3) {
    score -= 15;
    issues.push({
      type: "dek",
      severity: "critical",
      message: "Title is missing or too short",
    });
  }

  // 2. Word Count / Body depth (max -25)
  if (wordCount < 100) {
    score -= 25;
    issues.push({
      type: "word_count",
      severity: "critical",
      message: `Content is extremely short (${wordCount} words)`,
    });
  } else if (wordCount < 300 && piece.kind !== "KOBITA") {
    score -= 15;
    issues.push({
      type: "word_count",
      severity: "warning",
      message: `Content is under 300 words (${wordCount} words)`,
    });
  }

  // 3. Deck / Subtitle / Excerpt (max -15)
  if (!piece.dekBn && !piece.subtitleBn && !piece.excerptBn) {
    score -= 15;
    issues.push({
      type: "dek",
      severity: "warning",
      message: "Missing editorial deck or subtitle summary",
    });
  }

  // 4. Cover / Featured Image (max -15)
  const hasCoverImage = Boolean(piece.coverImage && piece.coverImage.trim());
  if (!hasCoverImage) {
    score -= 15;
    issues.push({
      type: "cover_image",
      severity: "warning",
      message: "No cover/featured image assigned",
    });
  }

  // 5. SEO Meta Description (max -15)
  const hasMetaDescription = Boolean(piece.seoDescription && piece.seoDescription.trim());
  if (!hasMetaDescription) {
    score -= 15;
    issues.push({
      type: "meta_description",
      severity: "warning",
      message: "Missing custom SEO meta description",
    });
  } else if (piece.seoDescription && (piece.seoDescription.length < 40 || piece.seoDescription.length > 180)) {
    score -= 5;
    issues.push({
      type: "meta_description",
      severity: "info",
      message: "SEO meta description length is not optimal (ideal: 50–160 chars)",
    });
  }

  // 6. Authors attributed (max -10)
  const hasAuthors = Boolean(piece.authors && piece.authors.length > 0);
  if (!hasAuthors) {
    score -= 10;
    issues.push({
      type: "author",
      severity: "warning",
      message: "No author attributed to this piece",
    });
  }

  // 7. Tags (max -5)
  const hasTags = Boolean(piece.tags && piece.tags.length > 0);
  if (!hasTags) {
    score -= 5;
    issues.push({
      type: "tags",
      severity: "info",
      message: "No taxonomy tags assigned",
    });
  }

  // 8. Stale content penalty (max -10)
  if (lastUpdatedDaysAgo > 365) {
    score -= 10;
    issues.push({
      type: "stale",
      severity: "info",
      message: `Article has not been updated in over ${Math.floor(lastUpdatedDaysAgo / 30)} months`,
    });
  }

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  let grade: "healthy" | "needs_attention" | "critical" = "healthy";
  if (score < 50) grade = "critical";
  else if (score < 80) grade = "needs_attention";

  return {
    id: piece.id,
    slug: piece.slug,
    titleBn: piece.titleBn,
    kind: piece.kind,
    status: piece.status,
    score,
    grade,
    wordCount,
    readingMinutes: piece.readingMinutes || 1,
    hasCoverImage,
    hasMetaDescription,
    hasAuthors,
    hasDek: Boolean(piece.dekBn || piece.subtitleBn),
    hasTags,
    lastUpdatedDaysAgo,
    issues,
    updatedAt: piece.updatedAt.toISOString(),
  };
}

export async function calculateContentHealth(): Promise<ContentHealthSummary> {
  const pieces = await prisma.piece.findMany({
    include: {
      authors: { select: { id: true, nameBn: true } },
      tags: { select: { id: true, labelBn: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const reports = pieces.map(evaluatePieceHealth);

  let totalScore = 0;
  let healthyCount = 0;
  let needsAttentionCount = 0;
  let criticalCount = 0;
  const issueCounts: Record<string, number> = {};

  for (const r of reports) {
    totalScore += r.score;
    if (r.grade === "healthy") healthyCount++;
    else if (r.grade === "needs_attention") needsAttentionCount++;
    else criticalCount++;

    for (const issue of r.issues) {
      issueCounts[issue.message] = (issueCounts[issue.message] || 0) + 1;
    }
  }

  const topIssues = Object.entries(issueCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([message, count]) => ({ message, count }));

  const averageScore = reports.length ? Math.round(totalScore / reports.length) : 100;

  return {
    averageScore,
    totalPieces: reports.length,
    healthyCount,
    needsAttentionCount,
    criticalCount,
    topIssues,
    pieces: reports,
  };
}
