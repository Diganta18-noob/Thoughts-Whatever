import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deriveCapabilities } from "@/lib/reference/rights-engine";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } },
) {
  try {
    const slug = decodeURIComponent(params.slug);

    const work = await prisma.referenceWork.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            slug: true,
            nameBn: true,
            nameEn: true,
            era: true,
            portrait: true,
          },
        },
        editions: {
          orderBy: { publicationYear: "asc" },
          include: {
            rights: true,
            sources: true,
            assets: {
              select: {
                id: true,
                kind: true,
                title: true,
                fileUrl: true,
                mimeType: true,
                durationSec: true,
                transcriptText: true,
                narrator: true,
                isDownloadable: true,
                isOnlineReadable: true,
              },
            },
          },
        },
      },
    });

    if (!work || !work.published) {
      return NextResponse.json(
        { error: "রেফারেন্স উপাদানটি খুঁজে পাওয়া যায়নি।" },
        { status: 404 },
      );
    }

    // Increment view counter asynchronously
    prisma.referenceWork
      .update({
        where: { id: work.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => {});

    const primaryEdition = work.editions[0] || null;
    const rightsStatus = primaryEdition?.rights?.status || "RIGHTS_UNVERIFIED";
    const hostingMode = primaryEdition?.hostingMode || "EXTERNAL";
    const sourceUrl = primaryEdition?.sources[0]?.sourceUrl || null;

    const capabilities = deriveCapabilities({
      rightsStatus,
      hostingMode,
      assets: primaryEdition?.assets || [],
      sourceUrl,
    });

    return NextResponse.json({
      work: {
        ...work,
        primaryEdition,
        capabilities,
      },
    });
  } catch (error) {
    console.error("[REFERENCE_SLUG_GET_ERROR]", error);
    return NextResponse.json(
      { error: "তথ্য লোড করতে সমস্যা হয়েছে।" },
      { status: 500 },
    );
  }
}
