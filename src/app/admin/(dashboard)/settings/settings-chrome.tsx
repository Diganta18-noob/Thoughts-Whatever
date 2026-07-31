"use client";

import { useTranslation } from "@/components/providers/language-provider";

export function SettingsChrome() {
  const t = useTranslation();

  return (
    <div className="border-b border-rule pb-4">
      <span className="label" lang="en">
        System Management
      </span>
      <h1 className="mt-1 text-2xl font-medium text-content">
        {t("admin.settingsPage.heading")}
      </h1>
    </div>
  );
}
