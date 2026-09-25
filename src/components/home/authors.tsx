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

export function Authors({ authors }: { authors: AuthorEntry[] }) {
  const { locale, isBn, t } = useLanguage();

  if (!authors.length) return null;

  return (
    <section className="py-16">
      <Reveal>
        <div className="mb-5 border-b border-rule pb-3">
          <h2 className="font-bengali text-2xl font-medium text-content" lang="bn">
            লেখক
          </h2>
          {!isBn && (
            <p className="mt-1 font-serif text-sm italic text-content-faint" lang="en">
              {t("home.authorsGloss")}
            </p>
          )}
        </div>
      </Reveal>

      <Stagger as="ul" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5" delay={0.1}>
        {authors.map((author) => {
          const countLabel = isBn
            ? `${formatNumber(author.count, locale)}টি রচনা`
            : `${author.count} ${author.count === 1 ? "story" : "stories"}`;
          const fullLabel = `${author.nameBn}, ${countLabel}`;

          return (
            <StaggerItem key={author.slug} as="li" className="min-w-0">
              <Link
                href={`/archive?author=${encodeURIComponent(author.slug)}`}
                aria-label={fullLabel}
                className="group flex items-center justify-between gap-2 rounded-md border border-rule/60 bg-surface-raised/30 px-3 py-2 text-left transition-all hover:border-accent/40 hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              >
                <span
                  className="author-name font-bengali text-sm sm:text-base text-content transition-colors group-hover:text-accent truncate"
                  lang="bn"
                >
                  {author.nameBn}
                </span>
                <span
                  aria-hidden="true"
                  className="author-count shrink-0 rounded bg-content/[0.05] px-1.5 py-0.5 font-mono text-[0.75rem] text-content-faint transition-colors group-hover:text-content-soft"
                >
                  ({formatNumber(author.count, locale)})
                </span>
              </Link>
            </StaggerItem>
          );
        })}
      </Stagger>
    </section>
  );
}
