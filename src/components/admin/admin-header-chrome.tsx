"use client";

import Link from "next/link";
import { useTranslation } from "@/components/providers/language-provider";

export function AdminHeaderBrand() {
  const t = useTranslation();
  return (
    <Link
      href="/admin"
      className="font-display text-lg text-content"
    >
      {t("admin.brand")}
    </Link>
  );
}

export function ViewSiteLink() {
  const t = useTranslation();
  return (
    <Link
      href="/"
      target="_blank"
      className="font-sans text-sm text-content-soft transition hover:text-accent"
    >
      {t("admin.viewSite")}
    </Link>
  );
}
