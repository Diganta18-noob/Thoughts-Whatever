"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useTranslation } from "@/components/providers/language-provider";

export function AdminDashboardHeader() {
  const t = useTranslation();

  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-6">
      <div>
        <span className="label">
          Admin Dashboard
        </span>
        <h1 className="mt-2 font-sans text-[1.75rem] font-medium text-content">
          {t("admin.dashboard.title")}
        </h1>
      </div>

      <Link
        href="/admin/pieces/new"
        className="inline-flex items-center gap-1.5 rounded-sm bg-accent px-4 py-2 font-sans text-[0.9375rem] text-surface transition hover:opacity-90"
      >
        <Plus className="h-4 w-4" />
        {t("admin.pieces.new")}
      </Link>
    </div>
  );
}
