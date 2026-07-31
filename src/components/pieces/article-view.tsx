import { Prose } from "@/components/reader/prose";
import { ReadingProgress } from "@/components/reader/reading-progress";
import { BookmarkButton } from "@/components/reader/bookmark-button";
import { PrintButton } from "@/components/reader/print-button";
import { QuoteCardPicker } from "@/components/reader/quote-card-picker";
import { NarrationButton } from "@/components/audio/narration-button";
import { ReelEmbed, VideoEmbed } from "@/components/pieces/media-embed";
import { PieceMeta, TagList, PieceEyebrow } from "@/components/pieces/piece-meta";
import { SourceList } from "@/components/pieces/source-list";
import { Timeline } from "@/components/pieces/timeline";
import { ContentsNav } from "@/components/pieces/contents-nav";
import { SeriesNav, type Neighbour } from "@/components/pieces/series-nav";
import { PieceCard, type PieceCardData } from "@/components/pieces/piece-card";
import { LetterBlock } from "@/components/newsletter/letter-block";
import { SectionHeading } from "@/components/layout/page-header";
import { T, Localized } from "@/components/i18n/t";
import { Num } from "@/components/i18n/values";
import { extractHeadings } from "@/lib/markdown";
import { KIND_META, piecePath } from "@/lib/nav";
import { absoluteUrl, siteConfig } from "@/lib/utils";
import type { FullPiece } from "@/lib/pieces";

import { ViewTracker } from "@/components/pieces/view-tracker";

const ARTICLE_ID = "piece-body";

/**
 * One reading page for all three kinds.
 *
 * Documentary pieces differ by surface, not by structure — the dark palette is
 * applied by `data-surface="archive"` on the page wrapper, and everything here
 * is written against the CSS variables, so nothing below needs a branch for it.
 */
export function ArticleView({
  piece,
  related,
  neighbours,
}: {
  piece: FullPiece;
  related: PieceCardData[];
  neighbours?: { prev: Neighbour; next: Neighbour };
}) {
  const headings = extractHeadings(piece.bodyBn);
  const showContents = headings.length >= 3;
  const kindMeta = KIND_META[piece.kind];

  return (
    <>
      <ReadingProgress targetId={ARTICLE_ID} />
      <ViewTracker pieceId={piece.id} />

      <article className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        {/* ─── Masthead ─────────────────────────────────────── */}
        <header className="mx-auto max-w-measure-wide pt-10 sm:pt-14">
          {piece.series ? (
            <PieceEyebrow
              label={
                <>
                  <span lang="bn" className="font-bengali tracking-normal">
                    {piece.series.titleBn}
                  </span>
                  {piece.seriesOrder ? (
                    <>
                      {" · "}
                      <Num
                        value={piece.seriesOrder}
                        className="tracking-normal"
                      />
                    </>
                  ) : null}
                </>
              }
              href={`/series/${piece.series.slug}`}
            />
          ) : (
            <PieceEyebrow
              label={
                <Localized
                  en={kindMeta.labelEn}
                  bn={kindMeta.labelBn}
                  bnClassName="font-bengali-sans tracking-normal"
                />
              }
              href={kindMeta.path}
            />
          )}

          <h1
            className="font-bengali text-[2rem] font-medium leading-[1.35] text-content sm:text-[2.6rem]"
            lang="bn"
          >
            {piece.titleBn}
          </h1>

          {piece.subtitleBn && (
            <p
              className="mt-3 font-bengali text-bengali-lg text-content-soft"
              lang="bn"
            >
              {piece.subtitleBn}
            </p>
          )}

          <PieceMeta
            className="mt-5"
            publishedAt={piece.publishedAt}
            readingMinutes={piece.readingMinutes}
            authors={piece.authors}
          />

          {/* ─── Toolbar ────────────────────────────────────── */}
          <div data-print="hide" className="mt-6 flex flex-wrap items-center gap-2">
            {piece.audioUrl && (
              <NarrationButton
                track={{
                  id: piece.slug,
                  src: piece.audioUrl,
                  titleBn: piece.titleBn,
                  href: piecePath(piece.kind, piece.slug),
                  durationSec: piece.audioSec ?? undefined,
                }}
              />
            )}
            <BookmarkButton
              slug={piece.slug}
              kind={piece.kind}
              titleBn={piece.titleBn}
              withLabel
            />
            <PrintButton />
          </div>
        </header>

        {/* ─── Media ────────────────────────────────────────── */}
        {(piece.videoUrl || piece.reelUrl) && (
          <div className="mx-auto mt-10 max-w-measure-wide">
            {piece.videoUrl ? (
              <VideoEmbed url={piece.videoUrl} poster={piece.coverImage} />
            ) : (
              <ReelEmbed url={piece.reelUrl!} poster={piece.coverImage} />
            )}
            <T
              as="p"
              k={piece.videoUrl ? "piece.fullTextBelow" : "piece.reelExpanded"}
              className="mt-3 text-center font-sans text-xs text-content-faint"
              bnClassName="font-bengali-sans"
            />
          </div>
        )}

        {/* Cover, when there is no video to lead with. */}
        {!piece.videoUrl && !piece.reelUrl && piece.coverImage && (
          <figure className="mx-auto mt-10 max-w-measure-wide">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={piece.coverImage}
              alt=""
              className="w-full rounded-sm border border-rule"
            />
          </figure>
        )}

        {/* ─── Standfirst ───────────────────────────────────── */}
        {piece.dekBn && (
          <p
            className="mx-auto mt-10 max-w-measure border-l-2 border-accent/40 pl-5 font-bengali text-bengali-lg text-content-soft"
            lang="bn"
          >
            {piece.dekBn}
          </p>
        )}

        {/* ─── Contents ─────────────────────────────────────── */}
        {showContents && <ContentsNav headings={headings} />}

        {/* ─── The piece ────────────────────────────────────── */}
        <div id={ARTICLE_ID} className="mx-auto mt-10 max-w-measure">
          <Prose body={piece.bodyBn} dropCap />
        </div>

        <QuoteCardPicker
          containerId={ARTICLE_ID}
          slug={piece.slug}
          titleBn={piece.titleBn}
        />

        {/* ─── Apparatus ────────────────────────────────────── */}
        <div className="mx-auto max-w-measure">
          {piece.timeline.length > 0 && <Timeline events={piece.timeline} />}
          {piece.sources.length > 0 && <SourceList sources={piece.sources} />}

          {piece.tags.length > 0 && (
            <div className="mt-12 border-t border-rule pt-6">
              <T
                k="piece.filedUnder"
                className="label mb-3 block"
                bnClassName="font-bengali-sans tracking-normal"
              />
              <TagList tags={piece.tags} />
            </div>
          )}

          {/* Only visible on paper — a printed page has no address bar. */}
          <p className="print-footer mt-8 border-t border-rule pt-4 text-xs text-content-faint">
            {siteConfig.name} — {absoluteUrl(piecePath(piece.kind, piece.slug))}
          </p>
        </div>

        {/* ─── Series navigation ────────────────────────────── */}
        {neighbours && (
          <SeriesNav prev={neighbours.prev} next={neighbours.next} />
        )}

        {/* ─── Letter ───────────────────────────────────────── */}
        <div className="mx-auto mt-16 max-w-measure">
          <LetterBlock source={`piece:${piece.slug}`} />
        </div>

        {/* ─── Related ──────────────────────────────────────── */}
        {related.length > 0 && (
          <section data-print="hide" className="mt-20">
            <SectionHeading labelEn="Keep reading" titleBn="এরপর পড়ুন" />
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <PieceCard key={item.slug} piece={item} showKind />
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
