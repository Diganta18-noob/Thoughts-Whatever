"use client";

import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { useLanguage } from "@/components/providers/language-provider";
import { formatNumber } from "@/lib/i18n/format";
import { KIND_META, type PieceKindKey } from "@/lib/nav";

import { SectionHeader } from "@/components/home/section-header";

export type KindCategoryData = {
  kind: PieceKindKey;
  count: number;
  latest?: { slug: string; titleBn: string } | null;
};

type FormTag = { slug: string; labelBn: string; count: number };

export function Categories({
  kinds,
  forms,
}: {
  kinds: KindCategoryData[];
  forms: FormTag[];
}) {
  const { locale, isBn, t } = useLanguage();

  if (!kinds.length && !forms.length) return null;

  const monoFace = isBn ? "font-bengali-sans" : "font-mono tracking-widest";

  return (
    <section className="py-section">
      <SectionHeader
        titleBn="বিভাগ"
        gloss={t("home.categoriesGloss")}
        rank="utility"
      />

      <Stagger as="ul" className="grid gap-px overflow-hidden rounded-sm bg-rule sm:grid-cols-3">
        {kinds.map(({ kind, count, latest }) => (
          <StaggerItem key={kind} as="li" className="bg-surface">
            <Link
              href={KIND_META[kind].path}
              className="group flex h-full flex-col justify-between gap-6 p-6 transition hover:bg-surface-raised"
            >
              <div>
                <div className="flex items-baseline justify-between gap-4">
                  <h3
                    className="font-display text-step-4 text-content transition group-hover:text-accent"
                    lang="bn"
                  >
                    {KIND_META[kind].labelBn}
                  </h3>
                  <span className="font-mono text-step-5 leading-none text-gold tabular-nums">
                    {formatNumber(count, locale)}
                  </span>
                </div>
                {!isBn && (
                  <p className="mt-1 font-serif text-sm italic text-content-faint" lang="en">
                    {KIND_META[kind].labelEn}
                  </p>
                )}
              </div>

              {latest ? (
                <div className="mt-auto border-t border-rule pt-4">
                  <span className={`text-step-0 text-content-faint ${monoFace}`}>
                    {t("home.latestIn") || "সর্বশেষ:"}
                  </span>
                  <p className="mt-1 font-bengali text-step-2 text-content-soft group-hover:text-accent transition line-clamp-1" lang="bn">
                    {latest.titleBn} →
                  </p>
                </div>
              ) : (
                <span className={`text-xs text-content-faint ${monoFace}`}>
                  {t("common.count", { count: formatNumber(count, locale) })}
                </span>
              )}
            </Link>
          </StaggerItem>
        ))}
      </Stagger>

      {forms.length > 0 && (
        <Stagger as="ul" className="mt-6 flex flex-wrap gap-2" delay={0.15}>
          {forms.map((tag) => (
            <StaggerItem key={tag.slug} as="li">
              <Link
                href={`/archive?tag=${encodeURIComponent(tag.slug)}`}
                className="inline-flex items-baseline gap-2 rounded-full border border-rule px-4 py-2 transition hover:border-accent/40 hover:text-accent"
              >
                <span className="font-bengali text-sm text-content" lang="bn">
                  {tag.labelBn}
                </span>
                <span className={`text-[0.6875rem] text-content-faint ${monoFace}`}>
                  {formatNumber(tag.count, locale)}
                </span>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </section>
  );
}
