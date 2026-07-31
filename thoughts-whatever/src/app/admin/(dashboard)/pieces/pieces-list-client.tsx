"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { formatBengaliDate, toBengaliNumber } from "@/lib/bengali";
import { KIND_META, piecePath, type PieceKindKey } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { DeletePieceButton } from "@/components/admin/delete-piece-button";
import { useTranslation } from "@/components/providers/language-provider";

type PieceRow = {
  id: string;
  slug: string;
  kind: PieceKindKey;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  titleBn: string;
  publishedAt: Date | null;
  updatedAt: Date;
  readingMinutes: number;
  series: { titleBn: string } | null;
  seriesOrder: number | null;
  _count: { sources: number };
};

type Search = { status?: string; kind?: string; q?: string };

function href(current: Search, patch: Search) {
  const merged = { ...current, ...patch };
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/admin/pieces?${qs}` : "/admin/pieces";
}

const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
const KINDS = ["RACHANA", "BLOG", "DOCUMENTARY"] as const;

function Chip({
  active,
  href: to,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={to}
      scroll={false}
      aria-pressed={active}
      className={cn(
        "rounded-sm border px-2.5 py-1 font-mono text-[0.6875rem] uppercase tracking-wider transition",
        active
          ? "border-accent/50 bg-accent/10 text-accent"
          : "border-rule text-content-soft hover:text-content",
      )}
    >
      {children}
    </Link>
  );
}

export function PiecesListClient({
  pieces,
  total,
  searchParams,
}: {
  pieces: PieceRow[];
  total: number;
  searchParams: Search;
}) {
  const t = useTranslation();

  const status = STATUSES.find((s) => s === searchParams.status);
  const kind = KINDS.find((k) => k === searchParams.kind);
  const q = searchParams.q?.trim() || undefined;

  const current: Search = {
    status: searchParams.status,
    kind: searchParams.kind,
    q: searchParams.q,
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="label" lang="en">
            Pieces · {toBengaliNumber(total)}
          </span>
          <h1
            className="mt-2 text-[1.75rem] font-medium text-content"
          >
            {t("admin.pieces.heading")}
          </h1>
        </div>

        <Link
          href="/admin/pieces/new"
          className="inline-flex items-center gap-1.5 rounded-sm bg-accent px-4 py-2 text-[0.9375rem] text-surface transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          {t("admin.pieces.newBtn")}
        </Link>
      </div>

      {/* Filters live in the URL so a half-finished draft list can be reopened
          from a bookmark instead of re-clicked. */}
      <div className="mt-7 flex flex-wrap items-center gap-2">
        <Chip active={!status && !kind} href="/admin/pieces">
          All
        </Chip>
        {STATUSES.map((s) => (
          <Chip
            key={s}
            active={status === s}
            href={href(current, { status: status === s ? undefined : s })}
          >
            {s}
          </Chip>
        ))}
        <span className="mx-1 h-4 w-px bg-rule" />
        {KINDS.map((k) => (
          <Chip
            key={k}
            active={kind === k}
            href={href(current, { kind: kind === k ? undefined : k })}
          >
            {KIND_META[k].labelEn}
          </Chip>
        ))}
      </div>

      <form action="/admin/pieces" className="mt-5">
        {status && <input type="hidden" name="status" value={status} />}
        {kind && <input type="hidden" name="kind" value={kind} />}
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder={t("admin.pieces.searchPlaceholder2")}
          className="w-full max-w-sm border-b border-rule bg-transparent py-2 text-[0.9375rem] text-content outline-none transition-colors placeholder:text-content-faint focus:border-accent"
        />
      </form>

      <ul className="mt-8 divide-y divide-rule border-y border-rule">
        {pieces.map((piece) => (
          <li key={piece.id} className="py-4">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <Link
                href={`/admin/pieces/${piece.id}`}
                className="font-bengali text-bengali-base text-content transition hover:text-accent"
                lang="bn"
              >
                {piece.titleBn}
              </Link>

              <span
                className={cn(
                  "font-mono text-[0.6875rem] uppercase tracking-wider",
                  piece.status === "PUBLISHED"
                    ? "text-content-faint"
                    : "text-accent",
                )}
              >
                {piece.status}
              </span>

              <span className="ml-auto flex items-center gap-4">
                {piece.status === "PUBLISHED" && (
                  <Link
                    href={piecePath(piece.kind, piece.slug)}
                    target="_blank"
                    className="font-serif text-xs text-content-soft transition hover:text-accent"
                    lang="en"
                  >
                    View
                  </Link>
                )}
                <DeletePieceButton id={piece.id} titleBn={piece.titleBn} />
              </span>
            </div>

            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.6875rem] text-content-faint">
              <span>{KIND_META[piece.kind].labelEn}</span>
              <span>/{piece.slug}</span>
              <span>
                {t("admin.pieces.minutes", { count: piece.readingMinutes })}
              </span>
              {piece.series && (
                <span className="font-bengali">
                  {piece.series.titleBn}
                  {piece.seriesOrder
                    ? ` · ${toBengaliNumber(piece.seriesOrder)}`
                    : ""}
                </span>
              )}
              {piece._count.sources > 0 && (
                <span>
                  {t("admin.pieces.sources", { count: piece._count.sources })}
                </span>
              )}
              <span>
                {piece.publishedAt
                  ? formatBengaliDate(piece.publishedAt)
                  : t("admin.pieces.editedOn", { date: formatBengaliDate(piece.updatedAt) })}
              </span>
            </p>
          </li>
        ))}

        {pieces.length === 0 && (
          <li
            className="py-8 text-sm text-content-soft"
          >
            {t("admin.pieces.emptyFilter")}
          </li>
        )}
      </ul>

      {total > pieces.length && (
        <p className="mt-4 text-xs text-content-faint">
          {t("admin.pieces.showingFirst", { count: pieces.length })}
        </p>
      )}
    </div>
  );
}
