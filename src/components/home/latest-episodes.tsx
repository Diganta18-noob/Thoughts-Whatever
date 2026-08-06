"use client";

import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { CoverImage } from "@/components/media/cover-image";
import { useLanguage } from "@/components/providers/language-provider";
import { formatReading, formatDate } from "@/lib/i18n/format";
import { piecePath } from "@/lib/nav";
import type { CardPiece } from "@/lib/pieces";

function LargeCard({ piece }: { piece: CardPiece }) {
  const { locale, isBn } = useLanguage();
  const href = piecePath(piece.kind, piece.slug);
  const monoFace = isBn ? "font-bengali-sans" : "font-mono tracking-widest";

  return (
    <article className="group">
      <Link href={href} className="block">
        {piece.coverImage && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-surface-raised">
            <CoverImage
              owner="piece"
              slug={piece.slug}
              coverImage={piece.coverImage}
              sizes="(max-width: 768px) 100vw, 60vw"
              className="transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </div>
        )}

        <div className="mt-5">
          <div className={`flex items-baseline gap-3 text-xs text-content-faint ${monoFace}`}>
            <time dateTime={piece.publishedAt?.toISOString()}>
              {piece.publishedAt && formatDate(piece.publishedAt, locale)}
            </time>
            <span>·</span>
            <span>{formatReading(piece.readingMinutes, locale)}</span>
          </div>

          <h3
            className="mt-3 font-bengali text-2xl font-medium leading-tight text-content transition group-hover:text-accent"
            lang="bn"
          >
            {piece.titleBn}
          </h3>

          {piece.dekBn && (
            <p
              className="mt-3 font-bengali text-base leading-relaxed text-content-soft"
              lang="bn"
            >
              {piece.dekBn}
            </p>
          )}

          {piece.excerptBn && (
            <p
              className="mt-4 line-clamp-3 font-bengali text-sm leading-relaxed text-content-faint"
              lang="bn"
            >
              {piece.excerptBn}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}

function SmallCard({ piece }: { piece: CardPiece }) {
  const { locale, isBn } = useLanguage();
  const href = piecePath(piece.kind, piece.slug);
  const monoFace = isBn ? "font-bengali-sans" : "font-mono tracking-widest";

  return (
    <article className="group">
      <Link href={href} className="block">
        {piece.coverImage && (
          <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-surface-raised">
            <CoverImage
              owner="piece"
              slug={piece.slug}
              coverImage={piece.coverImage}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </div>
        )}

        <div className="mt-4">
          <div className={`flex items-baseline gap-2 text-xs text-content-faint ${monoFace}`}>
            <time dateTime={piece.publishedAt?.toISOString()}>
              {piece.publishedAt && formatDate(piece.publishedAt, locale)}
            </time>
          </div>

          <h3
            className="mt-2 font-bengali text-base font-medium leading-snug text-content transition group-hover:text-accent"
            lang="bn"
          >
            {piece.titleBn}
          </h3>

          {piece.dekBn && (
            <p
              className="mt-2 line-clamp-2 font-bengali text-sm leading-relaxed text-content-soft"
              lang="bn"
            >
              {piece.dekBn}
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}

export function LatestEpisodes({ pieces }: { pieces: CardPiece[] }) {
  const { isBn, t } = useLanguage();

  if (!pieces.length) return null;

  const [lead, ...rest] = pieces;

  return (
    <section className="py-16">
      <Reveal>
        <div className="mb-8 border-b border-rule pb-3">
          <h2 className="font-bengali text-2xl font-medium text-content" lang="bn">
            সাম্প্রতিক
          </h2>
          {!isBn && (
            <p className="mt-1 font-serif text-sm italic text-content-faint" lang="en">
              {t("home.latestGloss")}
            </p>
          )}
        </div>
      </Reveal>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        {lead && (
          <Reveal delay={0.1}>
            <LargeCard piece={lead} />
          </Reveal>
        )}

        {rest.length > 0 && (
          <Stagger as="div" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1" delay={0.2}>
            {rest.slice(0, 3).map((piece) => (
              <StaggerItem key={piece.slug}>
                <SmallCard piece={piece} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </section>
  );
}
