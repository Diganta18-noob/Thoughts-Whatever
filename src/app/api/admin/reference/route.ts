import { prisma } from "@/lib/prisma";
import { guard, ok, fail, readBody } from "@/lib/admin-api";
import { referenceWorkInputSchema } from "@/lib/validation/reference";
import { validateHostingRights } from "@/lib/reference/rights-engine";
import { Prisma } from "@prisma/client";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const gate = await guard();
  if ("response" in gate) return gate.response;

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status") || "ALL";
  const query = searchParams.get("q")?.trim() || "";

  try {
    const where: Prisma.ReferenceWorkWhereInput = {};

    if (query) {
      where.OR = [
        { titleBn: { contains: query, mode: "insensitive" } },
        { titleEn: { contains: query, mode: "insensitive" } },
        { slug: { contains: query, mode: "insensitive" } },
        {
          editions: {
            some: {
              OR: [
                { editor: { contains: query, mode: "insensitive" } },
                { publisher: { contains: query, mode: "insensitive" } },
              ],
            },
          },
        },
      ];
    }

    if (statusFilter !== "ALL") {
      where.editions = {
        some: {
          rights: {
            status: statusFilter as any,
          },
        },
      };
    }

    const [works, statsGroup] = await Promise.all([
      prisma.referenceWork.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, nameBn: true, slug: true } },
          editions: {
            include: {
              rights: true,
              sources: true,
              assets: true,
              rightsLogs: {
                orderBy: { createdAt: "desc" },
                take: 3,
              },
            },
          },
        },
      }),
      Promise.all([
        prisma.referenceWork.count(),
        prisma.referenceRights.count({ where: { status: "PUBLIC_DOMAIN" } }),
        prisma.referenceRights.count({ where: { status: "LICENSED" } }),
        prisma.referenceRights.count({ where: { status: "EXTERNAL_SOURCE" } }),
        prisma.referenceRights.count({ where: { status: "RIGHTS_UNVERIFIED" } }),
        prisma.referenceRights.count({ where: { status: "RESTRICTED" } }),
      ]),
    ]);

    return ok({
      works,
      stats: {
        total: statsGroup[0],
        publicDomain: statsGroup[1],
        licensed: statsGroup[2],
        external: statsGroup[3],
        unverified: statsGroup[4],
        restricted: statsGroup[5],
        reviewRequired: statsGroup[4] + statsGroup[5],
      },
    });
  } catch (error) {
    console.error("[ADMIN_REFERENCE_GET_ERROR]", error);
    return fail("রেফারেন্স উপাদান তালিকা লোড করা সম্ভব হয়নি।", 500);
  }
}

export async function POST(request: Request) {
  const gate = await guard();
  if ("response" in gate) return gate.response;

  const body = await readBody(request, referenceWorkInputSchema);
  if ("response" in body) return body.response;

  const data = body.data;

  // Strict backend rights guardrail:
  if (data.edition) {
    try {
      validateHostingRights(
        data.edition.hostingMode,
        data.edition.rights.status,
      );
    } catch (err: any) {
      return fail(err.message || "স্বত্ব যাচাই ব্যর্থ হয়েছে।", 422);
    }
  }

  try {
    const existing = await prisma.referenceWork.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });

    if (existing) {
      return fail("এই স্লাগটি ইতিমধ্যে অন্য উপাদানে ব্যবহৃত হয়েছে।", 409);
    }

    const work = await prisma.referenceWork.create({
      data: {
        slug: data.slug,
        titleBn: data.titleBn,
        titleEn: data.titleEn || null,
        subtitleBn: data.subtitleBn || null,
        descriptionBn: data.descriptionBn || null,
        descriptionEn: data.descriptionEn || null,
        type: data.type,
        language: data.language,
        era: data.era || null,
        subject: data.subject || null,
        tags: data.tags,
        featured: data.featured,
        published: data.published,
        authorId: data.authorId || null,
        editions: data.edition
          ? {
              create: {
                editionTitleBn: data.edition.editionTitleBn || null,
                editor: data.edition.editor || null,
                translator: data.edition.translator || null,
                publisher: data.edition.publisher || null,
                publicationYear: data.edition.publicationYear || null,
                publicationPlace: data.edition.publicationPlace || null,
                isbn: data.edition.isbn || null,
                pages: data.edition.pages || null,
                notes: data.edition.notes || null,
                coverImage: data.edition.coverImage || null,
                hostingMode: data.edition.hostingMode,
                sources: {
                  create: {
                    sourceName: data.edition.source.sourceName,
                    sourceUrl: data.edition.source.sourceUrl,
                    externalId: data.edition.source.externalId || null,
                    sourceDescription:
                      data.edition.source.sourceDescription || null,
                  },
                },
                rights: {
                  create: {
                    status: data.edition.rights.status,
                    license: data.edition.rights.license || null,
                    licenseUrl: data.edition.rights.licenseUrl || null,
                    rightsHolder: data.edition.rights.rightsHolder || null,
                    attribution: data.edition.rights.attribution || null,
                    verificationNotes:
                      data.edition.rights.verificationNotes || null,
                    evidenceUrl: data.edition.rights.evidenceUrl || null,
                    permissionDocumentUrl:
                      data.edition.rights.permissionDocumentUrl || null,
                    verifiedBy:
                      data.edition.rights.status === "PUBLIC_DOMAIN" ||
                      data.edition.rights.status === "LICENSED"
                        ? gate.admin.email
                        : null,
                    verifiedAt:
                      data.edition.rights.status === "PUBLIC_DOMAIN" ||
                      data.edition.rights.status === "LICENSED"
                        ? new Date()
                        : null,
                  },
                },
                rightsLogs: {
                  create: {
                    previousStatus: "RIGHTS_UNVERIFIED",
                    newStatus: data.edition.rights.status,
                    changedBy: gate.admin.email,
                    reason: "Initial cataloging and rights configuration",
                    notes: data.edition.rights.verificationNotes || null,
                    evidenceUrl: data.edition.rights.evidenceUrl || null,
                  },
                },
              },
            }
          : undefined,
      },
      include: {
        editions: {
          include: {
            rights: true,
            sources: true,
          },
        },
      },
    });

    return ok({ work });
  } catch (error) {
    console.error("[ADMIN_REFERENCE_CREATE_ERROR]", error);
    return fail("রেফারেন্স উপাদানটি সংরক্ষণ করা সম্ভব হয়নি।", 500);
  }
}
