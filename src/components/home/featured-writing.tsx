"use client";

import Link from "next/link";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { CoverImage } from "@/components/media/cover-image";
import { useLanguage } from "@/components/providers/language-provider";
import { formatReading, formatDate } from "@/lib/i18n/format";
import { piecePath } from "@/lib/nav";
import type { CardPiece } from "@/lib/pieces";

import { motion } from "framer-motion";
import { CoverImageFrame } from "@/components/media/cover-image-frame";
import { useCardHover } from "@/lib/hooks/use-card-hover";

function EditorialCard({
  piece,
  layout,
}: {
  piece: CardPiece;
  layout: "large" | "wide" | "standard";
}) {
  const { locale, isBn } = useLanguage();
  const href = piecePath(piece.kind, piece.slug);
  const monoFace = isBn ? "font-bengali-sans" : "font-mono tracking-widest";
  const { cardMotionProps } = useCardHover();

  const aspect = "aspect-[3/4]";

  const sizes =
    layout === "large"
      ? "(max-width: 768px) 100vw, 50vw"
      : layout === "wide"
      ? "(max-width: 768px) 100vw, 66vw"
      : "(max-width: 640px) 50vw, 33vw";

  return (
    <motion.article className="group" {...cardMotionProps}>
      <Link href={href} className="block">
        {piece.coverImage && (
          <CoverImageFrame
            owner="piece"
            slug={piece.slug}
            coverImage={piece.coverImage}
            aspect={aspect}
            rounded="rounded-sm"
            sizes={sizes}
            overlay
          />
        )}

        <div className={layout === "large" ? "mt-6" : "mt-4"}>
          <div className={`flex items-baseline gap-3 text-xs text-content-faint ${monoFace}`}>
            <time dateTime={piece.publishedAt?.toISOString()}>
              {piece.publishedAt && formatDate(piece.publishedAt, locale)}
            </time>
            <span>·</span>
            <span>{formatReading(piece.readingMinutes, locale)}</span>
          </div>

          <h3
            className={`mt-3 font-bengali font-medium leading-tight text-content transition group-hover:text-accent ${
              layout === "large" ? "text-3xl" : "text-xl"
            }`}
            lang="bn"
          >
            {piece.titleBn}
          </h3>

          {piece.dekBn && (
            <p
              className={`mt-3 font-bengali leading-relaxed text-content-soft ${
                layout === "large" ? "text-lg" : "text-base"
              }`}
              lang="bn"
            >
              {piece.dekBn}
            </p>
          )}

          {layout === "large" && piece.excerptBn && (
            <p
              className="mt-4 line-clamp-4 font-bengali text-sm leading-relaxed text-content-faint"
              lang="bn"
            >
              {piece.excerptBn}
            </p>
          )}
        </div>
      </Link>
    </motion.article>
  );
}

import { SectionHeader } from "@/components/home/section-header";

export function FeaturedWriting({ pieces }: { pieces: CardPiece[] }) {
  const { isBn, t } = useLanguage();

  if (!pieces.length) return null;

  const [lead, second, ...rest] = pieces;

  return (
    <section className="py-section">
      <SectionHeader
        titleBn="নির্বাচিত"
        gloss={t("home.featuredGloss")}
        rank="section"
      />

      <div className="grid gap-8 lg:grid-cols-2">
        {lead && (
          <Reveal delay={0.1}>
            <EditorialCard piece={lead} layout="large" />
          </Reveal>
        )}

        <div className="space-y-8">
          {second && (
            <Reveal delay={0.2}>
              <EditorialCard piece={second} layout="wide" />
            </Reveal>
          )}

          {rest.length > 0 && (
            <Stagger as="div" className="grid gap-6 sm:grid-cols-2" delay={0.3}>
              {rest.slice(0, 4).map((piece) => (
                <StaggerItem key={piece.slug}>
                  <EditorialCard piece={piece} layout="standard" />
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>
      </div>
    </section>
  );
}
