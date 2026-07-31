import { prisma } from "@/lib/prisma";
import { TaxonomyClient } from "./taxonomy-client";

export const dynamic = "force-dynamic";

export const metadata = { title: "Taxonomy" };

export default async function TaxonomyPage() {
  const [authors, tags, series] = await Promise.all([
    prisma.author.findMany({
      select: {
        id: true,
        slug: true,
        nameBn: true,
        nameEn: true,
        era: true,
        bioBn: true,
        portrait: true,
        _count: { select: { pieces: true } },
      },
      orderBy: { nameBn: "asc" },
    }),
    prisma.tag.findMany({
      select: {
        id: true,
        slug: true,
        labelBn: true,
        labelEn: true,
        kind: true,
        _count: { select: { pieces: true } },
      },
      orderBy: [{ kind: "asc" }, { labelBn: "asc" }],
    }),
    prisma.series.findMany({
      select: {
        id: true,
        slug: true,
        titleBn: true,
        titleEn: true,
        descBn: true,
        coverImage: true,
        _count: { select: { pieces: true } },
      },
      orderBy: { titleBn: "asc" },
    }),
  ]);

  return (
    <TaxonomyClient
      authors={authors.map((author) => ({
        id: author.id,
        slug: author.slug,
        count: author._count.pieces,
        values: {
          nameBn: author.nameBn,
          nameEn: author.nameEn ?? "",
          era: author.era ?? "",
          bioBn: author.bioBn ?? "",
          portrait: author.portrait ?? "",
        },
      }))}
      tags={tags.map((tag) => ({
        id: tag.id,
        slug: tag.slug,
        count: tag._count.pieces,
        values: {
          labelBn: tag.labelBn,
          labelEn: tag.labelEn ?? "",
          kind: tag.kind,
        },
      }))}
      series={series.map((item) => ({
        id: item.id,
        slug: item.slug,
        count: item._count.pieces,
        values: {
          titleBn: item.titleBn,
          titleEn: item.titleEn ?? "",
          descBn: item.descBn ?? "",
          coverImage: item.coverImage ?? "",
        },
      }))}
    />
  );
}
