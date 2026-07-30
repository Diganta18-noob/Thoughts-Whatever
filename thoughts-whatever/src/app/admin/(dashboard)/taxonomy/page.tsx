import { prisma } from "@/lib/prisma";
import {
  TaxonomyManager,
  type TaxonomyField,
} from "@/components/admin/taxonomy-manager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Taxonomy" };

const AUTHOR_FIELDS: TaxonomyField[] = [
  { key: "nameBn", labelEn: "Name (Bengali)", primary: true, placeholderBn: "জীবনানন্দ দাশ" },
  { key: "nameEn", labelEn: "Name (English)", mono: true, placeholderBn: "Jibanananda Das" },
  { key: "era", labelEn: "Years", placeholderBn: "১৮৯৯–১৯৫৪" },
  { key: "bioBn", labelEn: "Note", type: "textarea", placeholderBn: "দুই-তিন লাইনের পরিচয়" },
  { key: "portrait", labelEn: "Portrait", mono: true, placeholderBn: "/portraits/….jpg" },
];

const TAG_FIELDS: TaxonomyField[] = [
  { key: "labelBn", labelEn: "Label (Bengali)", primary: true, placeholderBn: "দেশভাগ" },
  { key: "labelEn", labelEn: "Label (English)", mono: true, placeholderBn: "Partition" },
  {
    key: "kind",
    labelEn: "Group",
    type: "select",
    options: [
      { value: "FORM", label: "রূপ — কবিতা, ছোটগল্প, প্রবন্ধ" },
      { value: "THEME", label: "বিষয় — দেশভাগ, প্রেম, নগরজীবন" },
      { value: "ERA", label: "কাল — ত্রিশের দশক, রেনেসাঁস" },
      { value: "TOPIC", label: "অন্যান্য" },
    ],
  },
];

const SERIES_FIELDS: TaxonomyField[] = [
  { key: "titleBn", labelEn: "Title (Bengali)", primary: true, placeholderBn: "বাংলা কবিতার একশো বছর" },
  { key: "titleEn", labelEn: "Title (English)", mono: true },
  { key: "descBn", labelEn: "Description", type: "textarea", placeholderBn: "ধারাবাহিকটা কী নিয়ে" },
  { key: "coverImage", labelEn: "Cover", mono: true, placeholderBn: "/covers/….jpg" },
];

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
    <div>
      <span className="label" lang="en">
        Taxonomy
      </span>
      <h1
        className="mt-2 font-bengali text-[1.75rem] font-medium text-content"
        lang="bn"
      >
        নাম, বিষয়, ধারাবাহিক
      </h1>
      <p
        className="mt-2 max-w-measure font-bengali text-bengali-sm text-content-soft"
        lang="bn"
      >
        এখানে যা যোগ করবেন, লেখার সম্পাদকে সেটাই বেছে নেওয়ার জন্য আসবে। নাম
        দিলে <span className="font-mono text-xs">/authors</span> পাতাটা নিজে
        তৈরি হয়ে যায়।
      </p>

      <div className="mt-10 space-y-14">
        <TaxonomyManager
          titleEn="People"
          titleBn="যাঁদের নিয়ে লেখা"
          hintBn="লেখকের নাম নয় — লেখাটা যাঁকে নিয়ে।"
          endpoint="/api/admin/authors"
          addLabelBn="নাম যোগ করুন"
          countNounBn="টি লেখা"
          fields={AUTHOR_FIELDS}
          rows={authors.map((author) => ({
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
        />

        <TaxonomyManager
          titleEn="Tags"
          titleBn="বিষয়"
          hintBn="সংগ্রহের ছাঁকনি এই তালিকা থেকেই তৈরি হয়।"
          endpoint="/api/admin/tags"
          addLabelBn="বিষয় যোগ করুন"
          countNounBn="টি লেখা"
          fields={TAG_FIELDS}
          rows={tags.map((tag) => ({
            id: tag.id,
            slug: tag.slug,
            count: tag._count.pieces,
            values: {
              labelBn: tag.labelBn,
              labelEn: tag.labelEn ?? "",
              kind: tag.kind,
            },
          }))}
        />

        <TaxonomyManager
          titleEn="Series"
          titleBn="ধারাবাহিক"
          hintBn="পর্বের ক্রম লেখার সম্পাদক থেকে বসাতে হবে।"
          endpoint="/api/admin/series"
          addLabelBn="ধারাবাহিক যোগ করুন"
          countNounBn="টি পর্ব"
          fields={SERIES_FIELDS}
          rows={series.map((item) => ({
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
      </div>
    </div>
  );
}
