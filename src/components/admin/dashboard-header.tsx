"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useTranslation } from "@/components/providers/language-provider";
import { PageHeader, buttonVariants } from "@/components/ui";

export function AdminDashboardHeader() {
  const t = useTranslation();

  return (
    <PageHeader
      title={t("admin.dashboard.title")}
      subtitle="Admin Dashboard"
      className="border-b border-rule pb-6"
      actions={
        <Link
          href="/admin/pieces/new"
          className={buttonVariants({ variant: "primary", size: "md" })}
        >
          <Plus className="h-4 w-4" />
          {t("admin.pieces.new")}
        </Link>
      }
    />
  );
}
