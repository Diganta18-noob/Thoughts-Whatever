"use client";

import Link from "next/link";
import { toBengaliNumber } from "@/lib/bengali";
import { KIND_META, piecePath } from "@/lib/nav";
import { useTranslation, useLanguage } from "@/components/providers/language-provider";

export interface TopArticleItem {
  id: string;
  slug: string;
  titleBn: string;
  kind: "RACHANA" | "BLOG" | "DOCUMENTARY";
  publishedAt: string | Date | null;
  readingMinutes: number;
  views: number;
  clicks: number;
}

interface TopArticlesTableProps {
  articles: TopArticleItem[];
}

export function TopArticlesTable({ articles }: TopArticlesTableProps) {
  const t = useTranslation();
  const { isBn } = useLanguage();

  const formatNumber = (num: number) => (isBn ? toBengaliNumber(num) : num.toLocaleString());

  return (
    <div className="border border-rule bg-surface p-5">
      <div className="flex items-center justify-between pb-4 border-b border-rule">
        <div>
          <span className="label">
            Top Performing Content
          </span>
          <h3 className="font-sans text-lg font-medium text-content">
            {t("admin.dashboard.topArticles")}
          </h3>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left font-sans text-xs">
          <thead>
            <tr className="border-b border-rule font-mono text-[0.6875rem] uppercase tracking-wider text-content-faint">
              <th className="py-3 pr-4">{t("admin.pieces.tableTitle")}</th>
              <th className="py-3 px-3">{t("admin.pieces.tableKind")}</th>
              <th className="py-3 px-3 text-right">{t("admin.pieces.tableViews")}</th>
              <th className="py-3 pl-3 text-right">Instagram Clicks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule/60">
            {articles.map((art) => (
              <tr key={art.id} className="transition hover:bg-surface-raised">
                <td className="py-3 pr-4">
                  <Link
                    href={piecePath(art.kind, art.slug)}
                    target="_blank"
                    className="font-bengali text-bengali-base font-medium text-content hover:text-accent"
                    lang="bn"
                  >
                    {art.titleBn}
                  </Link>
                </td>
                <td className="py-3 px-3">
                  <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-content-faint">
                    {KIND_META[art.kind]?.labelEn || art.kind}
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-sans text-content">
                  {formatNumber(art.views)}
                </td>
                <td className="py-3 pl-3 text-right font-sans text-content-soft">
                  {formatNumber(art.clicks)}
                </td>
              </tr>
            ))}

            {articles.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center font-sans text-xs text-content-faint">
                  {t("common.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
