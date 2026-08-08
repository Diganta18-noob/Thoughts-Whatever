"use client";

import { useRef } from "react";
import { Prose } from "@/components/reader/prose";
import { ReadingProgress } from "@/components/reader/reading-progress";
import { QuoteCardPicker } from "@/components/reader/quote-card-picker";
import { ReelEmbed, VideoEmbed } from "@/components/pieces/media-embed";
import { TagList } from "@/components/pieces/piece-meta";
import { SourceList } from "@/components/pieces/source-list";
import { Timeline } from "@/components/pieces/timeline";
import { LetterBlock } from "@/components/newsletter/letter-block";
import { T } from "@/components/i18n/t";
import { extractHeadings } from "@/lib/markdown";
import { piecePath } from "@/lib/nav";
import { absoluteUrl, siteConfig } from "@/lib/utils";
import type { FullPiece } from "@/lib/pieces";

import { ArticleHero } from "@/components/reader/article-hero";
import { ArticleLeftSidebar } from "@/components/reader/article-left-sidebar";
import { ArticleRightSidebar } from "@/components/reader/article-right-sidebar";
import { ReelCallToAction } from "@/components/reader/reel-cta";

import { EpisodeCarousel } from "@/components/reader/episode-carousel";
import { ViewTracker } from "@/components/pieces/view-tracker";
import { SeriesNavigator } from "@/components/reader/series-navigator";


const ARTICLE_ID = "piece-body";

export function ArticleView({
  piece,
  related,
  neighbours,
}: {
  piece: FullPiece;
  related: any[];
  neighbours?: { prev?: any; next?: any };
}) {

  const headings = extractHeadings(piece.bodyBn);
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollToContent = () => {
    contentRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <ReadingProgress targetId={ARTICLE_ID} />
      <ViewTracker
        pieceId={piece.id}
        pieceProps={{
          slug: piece.slug,
          kind: piece.kind,
          titleBn: piece.titleBn,
          seriesId: piece.seriesId,
          seriesName: piece.series?.titleBn,
          seriesOrder: piece.seriesOrder,
          readingMinutes: piece.readingMinutes,
          publishedAt: piece.publishedAt,
        }}
      />


      <article className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        {/* 1. Cinematic Hero */}
        <ArticleHero piece={piece} onScrollToContent={scrollToContent} />

        {/* 2. 12-Column Responsive Editorial Grid (Left Sidebar | Content | Right Sidebar) */}
        <div ref={contentRef} className="mt-8 grid gap-8 lg:grid-cols-[1.8fr_4.4fr_1.8fr]">
          {/* Left Sticky Sidebar: TOC, Series Progress, Share */}
          <ArticleLeftSidebar
            headings={headings}
            seriesTitleBn={piece.series?.titleBn}
            seriesSlug={piece.series?.slug}
            currentEpisode={piece.seriesOrder || 1}
            totalEpisodes={piece.series?._count?.pieces || 6}
            slug={piece.slug}
            kind={piece.kind}
            titleBn={piece.titleBn}
          />

          {/* Center Column: Primary Article Body & Media */}
          <div className="min-w-0">
            {/* Instagram Reel CTA Banner if reelUrl exists */}
            {piece.reelUrl && (
              <ReelCallToAction
                reelUrl={piece.reelUrl}
                pieceId={piece.id}
                titleBn={piece.titleBn}
                coverImage={piece.coverImage}
                variant="banner"
                placement="inline"
              />
            )}

            {/* Video Embed if present */}
            {piece.videoUrl && (
              <div className="mb-8">
                <VideoEmbed url={piece.videoUrl} poster={piece.coverImage} />
              </div>
            )}


            {/* Standfirst / Excerpt */}
            {piece.dekBn && (
              <p
                className="mb-8 border-l-2 border-accent/60 pl-5 font-bengali text-bengali-lg text-content-soft leading-relaxed"
                lang="bn"
              >
                {piece.dekBn}
              </p>
            )}

            {/* Main Article Body with Drop Caps */}
            <div id={ARTICLE_ID} className="w-full">
              <Prose body={piece.bodyBn} dropCap />
            </div>

            <QuoteCardPicker
              containerId={ARTICLE_ID}
              slug={piece.slug}
              titleBn={piece.titleBn}
            />

            {/* Timeline, Sources & Series Navigation */}
            <div className="mt-12 space-y-8">
              {piece.series && (
                <SeriesNavigator
                  series={piece.series}
                  currentOrder={piece.seriesOrder}
                  prev={neighbours?.prev || null}
                  next={neighbours?.next || null}
                />
              )}
              {piece.timeline.length > 0 && <Timeline events={piece.timeline} />}
              {piece.sources.length > 0 && <SourceList sources={piece.sources} />}


              {piece.tags.length > 0 && (
                <div className="border-t border-rule/60 pt-6">
                  <T
                    k="piece.filedUnder"
                    className="label mb-3 block"
                    bnClassName="font-bengali-sans tracking-normal"
                  />
                  <TagList tags={piece.tags} />
                </div>
              )}

              <p className="print-footer mt-8 border-t border-rule/60 pt-4 text-xs text-content-faint">
                {siteConfig.name} — {absoluteUrl(piecePath(piece.kind, piece.slug))}
              </p>
            </div>
          </div>

          {/* Right Sticky Sidebar: Episode Meta & Next Episode */}
          <ArticleRightSidebar
            piece={piece}
            nextEpisode={
              related[0]
                ? {
                    slug: related[0].slug,
                    titleBn: related[0].titleBn,
                    coverImage: related[0].coverImage,
                  }
                : undefined
            }
          />
        </div>

        {/* 3. Continue The Journey: Netflix-style Episode Carousel */}
        {related.length > 0 && (
          <div className="mt-16">
            <EpisodeCarousel episodes={related} currentSlug={piece.slug} />
          </div>
        )}

        {/* 4. Newsletter Letter Block */}
        <div className="mx-auto mt-16 max-w-measure">
          <LetterBlock source={`piece:${piece.slug}`} />
        </div>
      </article>
    </>
  );
}
