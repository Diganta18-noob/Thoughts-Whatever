"use client";

import { useTranslation } from "@/components/providers/language-provider";
import { Logo } from "@/components/brand/logo";

export function LoginChrome() {
  const t = useTranslation();

  return (
    <div className="text-center">
      <Logo variant="full" width={120} className="mx-auto mb-6" />
      <span className="label" lang="en">
        {t("admin.login.brand")}
      </span>
      <h1 className="mt-3 text-[1.5rem] font-serif font-medium text-content">
        {t("admin.login.heading")}
      </h1>
      <p className="mt-2 text-sm text-content-soft">
        {t("admin.login.subheading")}
      </p>
    </div>
  );
}
