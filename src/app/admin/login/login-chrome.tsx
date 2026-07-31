"use client";

import { useTranslation } from "@/components/providers/language-provider";

export function LoginChrome() {
  const t = useTranslation();

  return (
    <>
      <span className="label" lang="en">
        {t("admin.login.brand")}
      </span>
      <h1 className="mt-3 text-[1.5rem] font-medium text-content">
        {t("admin.login.heading")}
      </h1>
      <p className="mt-2 text-sm text-content-soft">
        {t("admin.login.subheading")}
      </p>
    </>
  );
}
