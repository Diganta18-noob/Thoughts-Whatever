"use client";

import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { useLanguage } from "@/components/providers/language-provider";
import { formatNumber } from "@/lib/i18n/format";

type AuthorEntry = {
  slug: string;
  nameBn: string;
  count: number;
};

import { SectionHeader } from "@/components/home/section-header";

export function Authors({ authors }: { authors: AuthorEntry[] }) {
  const { locale, isBn, t } = useLanguage();

  if (!authors.length) return null;

  return (
    <section className="py-section">
      <SectionHeader
        titleBn="লেখক"
        gloss={t("home.authorsGloss")}
        rank="utility"
      />

      <Stagger as="ul" className="flex flex-wrap gap-x-6 gap-y-3" delay={0.1}>
        {authors.map((author) => (
          <StaggerItem key={author.slug} as="li">
            <Link
              href={`/archive?author=${encodeURIComponent(author.slug)}`}
              className="group inline-flex items-baseline gap-2 transition"
            >
              <span
                className="font-bengali text-lg text-content transition group-hover:text-accent"
                lang="bn"
              >
                {author.nameBn}
              </span>
              <span
                className={`text-[0.6875rem] text-content-faint ${
                  isBn ? "font-bengali-sans" : "font-mono tracking-widest"
                }`}
              >
                {formatNumber(author.count, locale)}
              </span>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
