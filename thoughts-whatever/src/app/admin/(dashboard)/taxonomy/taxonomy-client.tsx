"use client";

import { useTranslation } from "@/components/providers/language-provider";
import {
  TaxonomyManager,
  type TaxonomyField,
  type TaxonomyRow,
} from "@/components/admin/taxonomy-manager";

export function TaxonomyClient({
  authors,
  tags,
  series,
}: {
  authors: TaxonomyRow[];
  tags: TaxonomyRow[];
  series: TaxonomyRow[];
}) {
  const t = useTranslation();

  const AUTHOR_FIELDS: TaxonomyField[] = [
    { key: "nameBn", labelEn: "Name (Bengali)", primary: true, placeholderBn: t("admin.taxonomy.placeholderAuthorName") },
    { key: "nameEn", labelEn: "Name (English)", mono: true, placeholderBn: "Jibanananda Das" },
    { key: "era", labelEn: "Years", placeholderBn: t("admin.taxonomy.placeholderYears") },
    { key: "bioBn", labelEn: "Note", type: "textarea", placeholderBn: t("admin.taxonomy.placeholderBio") },
    { key: "portrait", labelEn: "Portrait", mono: true, placeholderBn: "/portraits/….jpg" },
  ];

  const TAG_FIELDS: TaxonomyField[] = [
    { key: "labelBn", labelEn: "Label (Bengali)", primary: true, placeholderBn: t("admin.taxonomy.placeholderTag") },
    { key: "labelEn", labelEn: "Label (English)", mono: true, placeholderBn: "Partition" },
    {
      key: "kind",
      labelEn: "Group",
      type: "select",
      options: [
        { value: "FORM", label: t("admin.taxonomy.tagGroupForm") },
        { value: "THEME", label: t("admin.taxonomy.tagGroupTheme") },
        { value: "ERA", label: t("admin.taxonomy.tagGroupEra") },
        { value: "TOPIC", label: t("admin.taxonomy.tagGroupTopic") },
      ],
    },
  ];

  const SERIES_FIELDS: TaxonomyField[] = [
    { key: "titleBn", labelEn: "Title (Bengali)", primary: true, placeholderBn: t("admin.taxonomy.placeholderSeriesTitle") },
    { key: "titleEn", labelEn: "Title (English)", mono: true },
    { key: "descBn", labelEn: "Description", type: "textarea", placeholderBn: t("admin.taxonomy.placeholderSeriesDesc") },
    { key: "coverImage", labelEn: "Cover", mono: true, placeholderBn: "/covers/….jpg" },
  ];

  return (
    <div>
      <span className="label" lang="en">
        Taxonomy
      </span>
      <h1 className="mt-2 text-[1.75rem] font-medium text-content">
        {t("admin.taxonomy.heading")}
      </h1>
      <p className="mt-2 max-w-measure text-sm text-content-soft">
        {t("admin.taxonomy.description")}
      </p>

      <div className="mt-10 space-y-14">
        <TaxonomyManager
          titleEn="People"
          titleBn={t("admin.taxonomy.people")}
          hintBn={t("admin.taxonomy.peopleHint")}
          endpoint="/api/admin/authors"
          addLabelBn={t("admin.taxonomy.addPerson")}
          countNounBn={t("admin.taxonomy.countPieces")}
          fields={AUTHOR_FIELDS}
          rows={authors}
        />

        <TaxonomyManager
          titleEn="Tags"
          titleBn={t("admin.taxonomy.tags2")}
          hintBn={t("admin.taxonomy.tagsHint")}
          endpoint="/api/admin/tags"
          addLabelBn={t("admin.taxonomy.addTag")}
          countNounBn={t("admin.taxonomy.countPieces")}
          fields={TAG_FIELDS}
          rows={tags}
        />

        <TaxonomyManager
          titleEn="Series"
          titleBn={t("admin.taxonomy.series2")}
          hintBn={t("admin.taxonomy.seriesHint")}
          endpoint="/api/admin/series"
          addLabelBn={t("admin.taxonomy.addSeries")}
          countNounBn={t("admin.taxonomy.countEpisodes")}
          fields={SERIES_FIELDS}
          rows={series}
        />
      </div>
    </div>
  );
}
