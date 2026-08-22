import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPieceByPreviewToken } from "@/lib/staging";
import { Prose } from "@/components/reader/prose";
import { countBengaliWords, readingMinutes, formatBengaliDate } from "@/lib/bengali";
import {
  ShieldAlert,
  Clock,
  ArrowLeft,
  FileEdit,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Staging Preview | Editor's Room",
  robots: {
    index: false,
    follow: false,
  },
};

interface PreviewPageProps {
  params: { token: string };
}

export default async function StagingPreviewPage({ params }: PreviewPageProps) {
  const token = params.token;
  if (!token) notFound();

  const piece = await getPieceByPreviewToken(token);

  if (!piece) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full rounded-sm border border-rule bg-surface-raised p-8 text-center space-y-4">
          <ShieldAlert className="h-10 w-10 text-rose-600 mx-auto" />
          <h1 className="font-serif text-xl text-content">Invalid Preview Link</h1>
          <p className="text-xs text-content-soft">
            This staging preview link is either invalid or has been revoked. Please request a fresh preview link from the Editor's Room.
          </p>
          <Link
            href="/admin/pieces"
            className="inline-flex items-center gap-1.5 rounded-sm bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent/90 transition"
          >
            Go to Pieces
          </Link>
        </div>
      </div>
    );
  }

  if (piece.isExpired) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full rounded-sm border border-rule bg-surface-raised p-8 text-center space-y-4">
          <Clock className="h-10 w-10 text-amber-600 mx-auto" />
          <h1 className="font-serif text-xl text-content">Preview Link Expired</h1>
          <p className="text-xs text-content-soft">
            This staging token has expired. Staging preview tokens expire after 72 hours for security.
          </p>
          <Link
            href={`/admin/pieces/${piece.id}`}
            className="inline-flex items-center gap-1.5 rounded-sm bg-accent px-4 py-2 text-xs font-semibold text-white hover:bg-accent/90 transition"
          >
            Regenerate in Editor
          </Link>
        </div>
      </div>
    );
  }

  const words = countBengaliWords(piece.bodyBn);
  const minutes = piece.readingMinutes || readingMinutes(piece.bodyBn);
  const reviewComments = Array.isArray(piece.reviewComments) ? (piece.reviewComments as any[]) : [];

  return (
    <div className="min-h-screen bg-surface text-content pb-24">
      {/* Floating Staging Top Banner */}
      <aside aria-label="Staging banner" className="sticky top-0 z-50 border-b border-amber-500/30 bg-amber-50/95 dark:bg-amber-950/80 backdrop-blur-md px-4 py-2.5 shadow-sm">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs font-sans">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-mono text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider">
              STAGING PREVIEW
            </span>
            <span className="rounded bg-amber-200/60 dark:bg-amber-900/60 px-1.5 py-0.5 font-mono text-[10px] text-amber-900 dark:text-amber-200 font-semibold uppercase">
              {piece.reviewStatus || piece.status}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-amber-800/80 dark:text-amber-300/80 font-mono hidden sm:inline">
              Expires: {piece.previewExpiresAt ? new Date(piece.previewExpiresAt).toLocaleDateString() : "48h"}
            </span>

            <Link
              href={`/admin/pieces/${piece.id}`}
              className="inline-flex items-center gap-1 font-semibold text-amber-900 dark:text-amber-200 hover:underline"
            >
              <FileEdit className="h-3 w-3" /> Edit Piece
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Article Container */}
      <main className="max-w-3xl mx-auto px-6 pt-12 space-y-8">
        {/* Header section */}
        <header className="space-y-4 border-b border-rule pb-8">
          <div className="flex items-center gap-2 font-mono text-xs text-content-faint uppercase">
            <span>{piece.kind}</span>
            {piece.series && (
              <>
                <span>•</span>
                <span className="text-accent">{piece.series.titleBn}</span>
              </>
            )}
          </div>

          <h1 className="font-bengali text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.3] text-content" lang="bn">
            {piece.titleBn}
          </h1>

          {piece.subtitleBn && (
            <p className="font-bengali text-xl text-content-soft leading-relaxed" lang="bn">
              {piece.subtitleBn}
            </p>
          )}

          {piece.dekBn && (
            <p className="font-bengali text-base italic text-content-soft" lang="bn">
              {piece.dekBn}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-content-faint pt-2">
            {piece.authors && piece.authors.length > 0 && (
              <span>লেখক: {piece.authors.map((a) => a.nameBn).join(", ")}</span>
            )}
            <span>{minutes} মিনিট পাঠ</span>
            <span>{words} শব্দ</span>
          </div>
        </header>

        {/* Cover Image if available */}
        {piece.coverImage && (
          <figure className="rounded-sm overflow-hidden border border-rule">
            <img
              src={piece.coverImage}
              alt={piece.titleBn}
              className="w-full max-h-[500px] object-cover"
            />
          </figure>
        )}

        {/* Article Body */}
        <article className="pt-4">
          <Prose body={piece.bodyBn} dropCap />
        </article>

        {/* Editorial Review Comments Log */}
        {reviewComments.length > 0 && (
          <section className="mt-16 rounded-sm border border-rule bg-surface-raised p-6 space-y-4 font-sans text-xs">
            <h3 className="label">
              Editorial Review Notes ({reviewComments.length})
            </h3>
            <div className="space-y-3 divide-y divide-rule/50">
              {reviewComments.map((c: any) => (
                <div key={c.id} className="pt-3 space-y-1">
                  <div className="flex justify-between font-mono text-[10px] text-content-faint">
                    <span className="font-bold text-content">{c.authorName || c.authorEmail}</span>
                    <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-content-soft leading-relaxed">{c.comment}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
