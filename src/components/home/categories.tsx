"use client";

import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { useLanguage } from "@/components/providers/language-provider";
import { formatNumber } from "@/lib/i18n/format";
import { KIND_META, type PieceKindKey } from "@/lib/nav";

type KindCount = { kind: PieceKindKey; count: number };
type FormTag = { slug: string; labelBn: string; count: number };

export function Categories({
  kinds,
  forms,
}: {
  kinds: KindCount[];
  forms: FormTag[];
}) {
  const { locale, isBn, t } = useLanguage();

  if (!kinds.length && !forms.length) return null;

  const monoFace = isBn ? "font-bengali-sans" : "font-mono tracking-widest";

  return (
    <section className="py-16">
      <Reveal>
        <div className="mb-8 border-b border-rule pb-3">
          <h2 className="font-bengali text-2xl font-medium text-content" lang="bn">
            বিভাগ
          </h2>
          {!isBn && (
            <p className="mt-1 font-serif text-sm italic text-content-faint" lang="en">
              {t("home.categoriesGloss")}
            </p>
          )}
        </div>
      </Reveal>

      <Stagger as="ul" className="grid gap-px overflow-hidden rounded-sm bg-rule sm:grid-cols-3">
        {kinds.map(({ kind, count }) => (
          <StaggerItem key={kind} as="li" className="bg-surface">
            <Link
              href={KIND_META[kind].path}
              className="group flex h-full flex-col justify-between gap-6 p-6 transition hover:bg-surface-raised"
            >
              <div>
                <h3
                  className="font-bengali text-xl font-medium text-content transition group-hover:text-accent"
                  lang="bn"
                >
                  {KIND_META[kind].labelBn}
                </h3>
                {!isBn && (
                  <p className="mt-1 font-serif text-sm italic text-content-faint" lang="en">
                    {KIND_META[kind].labelEn}
                  </p>
                )}
              </div>
              <span className={`text-xs text-content-faint ${monoFace}`}>
                {t("common.count", { count: formatNumber(count, locale) })}
              </span>
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
