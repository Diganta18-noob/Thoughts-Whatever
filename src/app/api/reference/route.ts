import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ReferenceType,
  ReferenceLanguage,
  ReferenceRightsStatus,
  Prisma,
} from "@prisma/client";
import { deriveCapabilities } from "@/lib/reference/rights-engine";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("q")?.trim() || "";
  const type = searchParams.get("type") as ReferenceType | null;
  const language = searchParams.get("language") as ReferenceLanguage | null;
  const rights = searchParams.get("rights") as ReferenceRightsStatus | null;
  const format = searchParams.get("format")?.toLowerCase() || null;
  const authorSlug = searchParams.get("author")?.trim() || null;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
  const skip = (page - 1) * limit;

  try {
    const where: Prisma.ReferenceWorkWhereInput = {
      published: true,
    };

    if (type && Object.values(ReferenceType).includes(type)) {
      where.type = type;
    }

    if (language && Object.values(ReferenceLanguage).includes(language)) {
      where.language = language;
    }

    if (authorSlug) {
      where.author = { slug: authorSlug };
    }

    if (query) {
      where.OR = [
        { titleBn: { contains: query, mode: "insensitive" } },
        { titleEn: { contains: query, mode: "insensitive" } },
        { subtitleBn: { contains: query, mode: "insensitive" } },
        { descriptionBn: { contains: query, mode: "insensitive" } },
        { subject: { contains: query, mode: "insensitive" } },
        { era: { contains: query, mode: "insensitive" } },
        {
          editions: {
            some: {
              OR: [
                { editor: { contains: query, mode: "insensitive" } },
                { translator: { contains: query, mode: "insensitive" } },
                { publisher: { contains: query, mode: "insensitive" } },
              ],
            },
          },
        },
      ];
    }

    if (rights && Object.values(ReferenceRightsStatus).includes(rights)) {
      where.editions = {
        some: {
          rights: {
            status: rights,
          },
        },
      };
    }

    if (format) {
      if (format === "audio") {
        where.editions = {
          some: {
            assets: {
              some: { kind: "AUDIO" },
            },
          },
        };
      } else if (format === "pdf") {
        where.editions = {
          some: {
            assets: {
              some: { kind: "PDF" },
            },
          },
        };
      } else if (format === "transcript") {
        where.editions = {
          some: {
            assets: {
              some: { kind: "TRANSCRIPT" },
            },
          },
        };
      }
    }

    const [total, works, statsGroup] = await Promise.all([
      prisma.referenceWork.count({ where }),
      prisma.referenceWork.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        include: {
          author: {
            select: { id: true, slug: true, nameBn: true, nameEn: true },
          },
          editions: {
            take: 1,
            orderBy: { publicationYear: "asc" },
            include: {
              rights: true,
              sources: { take: 1 },
              assets: true,
            },
          },
        },
      }),
      // Live archive stats for header counters
      Promise.all([
        prisma.referenceWork.count({ where: { published: true } }),
        prisma.referenceWork.count({
          where: { published: true, type: { in: ["BOOK", "ARTICLE"] } },
        }),
        prisma.referenceWork.count({
          where: { published: true, type: { in: ["DOCUMENT", "MANUSCRIPT", "ARCHIVE"] } },
        }),
        prisma.referenceAsset.count({
          where: { kind: "AUDIO" },
        }),
        prisma.referenceSource.count(),
      ]),
    ]);

    const formattedWorks = works.map((w) => {
      const primaryEdition = w.editions[0] || null;
      const rightsStatus = primaryEdition?.rights?.status || "RIGHTS_UNVERIFIED";
      const hostingMode = primaryEdition?.hostingMode || "EXTERNAL";
      const sourceUrl = primaryEdition?.sources[0]?.sourceUrl || null;

      const capabilities = deriveCapabilities({
        rightsStatus,
        hostingMode,
        assets: primaryEdition?.assets || [],
        sourceUrl,
      });

      return {
        id: w.id,
        slug: w.slug,
        titleBn: w.titleBn,
        titleEn: w.titleEn,
        subtitleBn: w.subtitleBn,
        descriptionBn: w.descriptionBn,
        type: w.type,
        language: w.language,
        era: w.era,
        subject: w.subject,
        tags: w.tags,
        featured: w.featured,
        viewCount: w.viewCount,
        author: w.author,
        primaryEdition: primaryEdition
          ? {
              id: primaryEdition.id,
              editionTitleBn: primaryEdition.editionTitleBn,
              editor: primaryEdition.editor,
              translator: primaryEdition.translator,
              publisher: primaryEdition.publisher,
              publicationYear: primaryEdition.publicationYear,
              coverImage: primaryEdition.coverImage,
              hostingMode: primaryEdition.hostingMode,
              rightsStatus,
              rights: primaryEdition.rights,
              source: primaryEdition.sources[0] || null,
              assetsCount: primaryEdition.assets.length,
            }
          : null,
        capabilities,
      };
    });

    return NextResponse.json({
      works: formattedWorks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalWorks: statsGroup[0],
        totalTexts: statsGroup[1],
        totalDocuments: statsGroup[2],
        totalAudio: statsGroup[3],
        totalExternalSources: statsGroup[4],
      },
    });
  } catch (error) {
    console.error("[REFERENCE_GET_ERROR]", error);
    return NextResponse.json(
      { error: "রেফারেন্স লাইব্রেরি লোড করা সম্ভব হয়নি।" },
      { status: 500 },
    );
  }
}
