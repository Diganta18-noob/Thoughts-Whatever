"use client";

import Link from "next/link";
import { useTranslation } from "@/components/providers/language-provider";
import { Logo } from "@/components/brand/logo";

export function AdminHeaderBrand() {
  const t = useTranslation();
  return (
    <Link
      href="/admin"
      className="flex items-center gap-2.5 group"
    >
      <Logo variant="compact" showSubtitle={false} className="transition-transform group-hover:scale-105" />
      <span className="font-serif text-base font-medium text-content group-hover:text-accent">
        Editor's Room
      </span>
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
