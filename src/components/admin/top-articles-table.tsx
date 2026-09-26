"use client";

import Link from "next/link";
import { toBengaliNumber } from "@/lib/bengali";
import { KIND_META, piecePath } from "@/lib/nav";
import { useTranslation, useLanguage } from "@/components/providers/language-provider";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
  Badge,
} from "@/components/ui";

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
    <Card>
      <CardHeader className="py-4">
        <div>
          <span className="label">
            Top Performing Content
          </span>
          <CardTitle className="text-lg font-medium">
            {t("admin.dashboard.topArticles")}
          </CardTitle>
        </div>
      </CardHeader>

      <CardBody className="p-0">
        <Table>
          <THead>
            <TR>
              <TH>{t("admin.pieces.tableTitle")}</TH>
              <TH>{t("admin.pieces.tableKind")}</TH>
              <TH className="text-right">{t("admin.pieces.tableViews")}</TH>
              <TH className="text-right">Instagram Clicks</TH>
            </TR>
          </THead>
          <TBody>
            {articles.map((art) => (
              <TR key={art.id}>
                <TD>
                  <Link
                    href={piecePath(art.kind, art.slug)}
                    target="_blank"
                    className="font-body text-bengali-base font-medium text-content hover:text-accent transition-colors"
                    lang="bn"
                  >
                    {art.titleBn}
                  </Link>
                </TD>
                <TD>
                  <Badge tone="neutral">
                    {KIND_META[art.kind]?.labelEn || art.kind}
                  </Badge>
                </TD>
                <TD className="text-right font-mono text-content">
                  {formatNumber(art.views)}
                </TD>
                <TD className="text-right font-mono text-content-soft">
                  {formatNumber(art.clicks)}
                </TD>
              </TR>
            ))}

            {articles.length === 0 && (
              <TR>
                <TD colSpan={4} className="py-8 text-center text-xs text-content-faint">
                  {t("common.empty")}
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </CardBody>
    </Card>
  );
}
