"use client";

import { useTranslation } from "@/components/providers/language-provider";

export function SeriesChrome() {
  const t = useTranslation();

  return (
    <div className="border-b border-rule pb-4">
      <span className="label" lang="en">
        Content Organization
      </span>
      <h1 className="mt-1 text-2xl font-medium text-content">
        {t("admin.series.heading")}
      </h1>
    </div>
  );
}
