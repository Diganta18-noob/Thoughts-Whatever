"use client";

import Link from "next/link";
import { toBanglaDate } from "@/lib/bengali";
import { formatDate, formatNumber, formatReading } from "@/lib/i18n/format";
import { KIND_META, piecePath, type PieceKindKey } from "@/lib/nav";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";
import { EditorialImage } from "@/components/pieces/editorial-image";

export type PieceCardData = {
  slug: string;
  kind: PieceKindKey;
  titleBn: string;
  dekBn?: string | null;
  excerptBn?: string | null;
  coverImage?: string | null;
  coverImageWidth?: number | null;
  coverImageHeight?: number | null;
  readingMinutes: number;
  publishedAt: Date | string | null;
  authors?: { slug: string; nameBn: string }[];
  audioUrl?: string | null;
  reelUrl?: string | null;
};


/**
 * The section name on a card. Both languages already live in `KIND_META`, so
 * they are read from there rather than copied into the dictionaries.
 */
function KindLabel({ kind }: { kind: PieceKindKey }) {
  const { locale, isBn } = useLanguage();
  const meta = KIND_META[kind];

  return (
    <span
      className={cn("label !text-accent", isBn && "font-bengali-sans tracking-normal")}
      lang={locale}
    >
      {isBn ? meta.labelBn : meta.labelEn}
    </span>
  );
}

/**
 * The dual dateline on a card, one span per calendar.
 *
 * `formatDualDate` returns the pair as a single string, which is right for a
 * `title` or a plain-text context but wrong here: a screen reader would read
 * half of it in the wrong voice. Split, each half carries its own `lang`.
 */
function CardDate({ publishedAt }: { publishedAt: Date | string }) {
  const { locale, isBn } = useLanguage();
  const bangla = toBanglaDate(publishedAt);

  return (
    <span className="flex items-center gap-1.5 text-[0.6875rem] text-content-faint">
      <span lang={locale} className={isBn ? "font-bengali-sans" : "font-sans"}>
        {formatDate(publishedAt, locale)}
      </span>
      {bangla && (
        <>
          <span aria-hidden className="text-rule">
            ·
          </span>
          <span lang="bn" className="font-bengali-sans">
            {bangla.formatted}
          </span>
        </>
      )}
    </span>
  );
}

/**
 * The standard index entry.
 *
 * `lead` is the one used at the top of a section or the home page; the rest of
 * a list uses the compact form. Deliberately text-first — a Bengali title set
 * in a serif at a readable size does more to make someone click than a
 * thumbnail does, and most pieces here are writing, not images.
 */
export function PieceCard({
  piece,
  variant = "journal",
  lead = false,
  showKind = false,
}: {
  piece: PieceCardData;
  variant?: "journal" | "archive";
  lead?: boolean;
  showKind?: boolean;
}) {
  const { t, locale, isBn } = useLanguage();
  const archive = variant === "archive";
  const summary = piece.dekBn || piece.excerptBn;
  const metaFace = isBn ? "font-bengali-sans" : "font-sans";

  return (
    <article
      className={cn(
        "group",
        archive && "border border-archive-panelEdge bg-archive-panel/60 p-5",
      )}
    >
      <Link href={piecePath(piece.kind, piece.slug)} className="block">
        {piece.coverImage && (lead || archive) && (
          <div className="mb-4">
            <EditorialImage
              src={piece.coverImage}
              alt={piece.titleBn}
              width={piece.coverImageWidth}
              height={piece.coverImageHeight}
              priority={lead}
              layout={lead ? "auto" : "card"}
            />
          </div>
        )}

        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {showKind && <KindLabel kind={piece.kind} />}
          {piece.publishedAt && <CardDate publishedAt={piece.publishedAt} />}
          <span
            className={cn(metaFace, "text-[0.6875rem] text-content-faint")}
            lang={locale}
          >
            {formatReading(piece.readingMinutes, locale)}
          </span>
          {piece.audioUrl && (
            <span className={cn(metaFace, "text-[0.6875rem] text-accent")} lang={locale}>
              {t("piece.hasNarration")}
            </span>
          )}
        </div>

        <h3
          className={cn(
            "font-bengali font-medium text-content transition-colors group-hover:text-accent",
            lead ? "text-2xl leading-snug sm:text-[1.75rem]" : "text-lg leading-snug",
          )}
          lang="bn"
        >
          {piece.titleBn}
        </h3>

        {summary && (
          <p
            className={cn(
              "mt-2 font-bengali text-content-soft",
              lead ? "text-bengali-base line-clamp-3" : "text-bengali-sm line-clamp-2",
            )}
            lang="bn"
          >
            {summary}
          </p>
        )}
      </Link>

      {/* Author names are content, so they stay Bengali and say so, even when
          the chrome around them is English. */}
      {piece.authors && piece.authors.length > 0 && (
        <p
          className="mt-2.5 flex flex-wrap gap-x-2 font-bengali text-xs text-content-faint"
          lang="bn"
        >
          {piece.authors.map((author, i) => (
            <span key={author.slug}>
              <Link
                href={`/authors/${author.slug}`}
                className="transition hover:text-accent"
              >
                {author.nameBn}
              </Link>
              {i < piece.authors!.length - 1 && " ·"}
            </span>
          ))}
        </p>
      )}
    </article>
  );
}

/** A numbered archive row — used on /archive and series listings. */
export function PieceRow({
  piece,
  index,
}: {
  piece: PieceCardData;
  index?: number;
}) {
  const { locale, isBn } = useLanguage();

  return (
    <Link
      href={piecePath(piece.kind, piece.slug)}
      className="group flex gap-4 border-b border-rule py-4 transition hover:bg-accent/[0.03]"
    >
      {typeof index === "number" && (
        <span
          aria-hidden
          className={cn(
            "w-8 shrink-0 pt-1 text-xs text-content-faint",
            isBn ? "font-bengali-sans" : "font-mono",
          )}
        >
          {formatNumber(String(index + 1).padStart(2, "0"), locale)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h3
          className="font-bengali text-[1.0625rem] leading-snug text-content transition-colors group-hover:text-accent"
          lang="bn"
        >
          {piece.titleBn}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-x-3">
          <KindLabel kind={piece.kind} />
          {piece.publishedAt && <CardDate publishedAt={piece.publishedAt} />}
          <span
            className={cn(
              "text-[0.6875rem] text-content-faint",
              isBn ? "font-bengali-sans" : "font-sans",
            )}
            lang={locale}
          >
            {formatReading(piece.readingMinutes, locale)}
          </span>
        </div>
      </div>
    </Link>
  );
}
