"use client";

import Link from "next/link";
import { useTranslation } from "@/components/providers/language-provider";

export function AdminHeaderBrand() {
  const t = useTranslation();
  return (
    <Link
      href="/admin"
      className="flex items-center gap-2 group"
    >
      <span className="font-serif text-lg font-bold tracking-tighter text-content group-hover:text-accent leading-none">
        t.w
      </span>
      <span className="h-3.5 w-[1px] bg-rule/80" />
      <span className="font-serif text-sm font-medium text-content group-hover:text-accent leading-none">
        Editor&apos;s Room
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
