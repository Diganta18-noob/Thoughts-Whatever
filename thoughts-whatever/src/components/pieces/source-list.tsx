import { ExternalLink } from "lucide-react";
import { T } from "@/components/i18n/t";
import { toBengaliNumber } from "@/lib/bengali";

export type SourceItem = {
  id: string;
  label: string;
  url?: string | null;
  note?: string | null;
};

/**
 * তথ্যসূত্র.
 *
 * This block is the difference between a researched documentary and an
 * aesthetic quote page. It is rendered plainly and completely — numbered,
 * linked where a link exists, with the annotation visible rather than hidden
 * behind a tooltip — because the readers who check sources are exactly the
 * readers worth keeping.
 */
export function SourceList({ sources }: { sources: SourceItem[] }) {
  if (!sources.length) return null;

  return (
    <section className="mt-14 border-t border-rule pt-8" aria-labelledby="sources">
      <h2 id="sources" className="mb-5 text-lg text-content">
        <T k="piece.sources" className="font-serif" bnClassName="font-bengali" />
      </h2>

      <ol className="space-y-4">
        {sources.map((source, i) => (
          <li key={source.id} className="flex gap-3">
            <span className="w-6 shrink-0 pt-[0.15rem] text-right font-mono text-xs text-content-faint">
              {toBengaliNumber(i + 1)}.
            </span>
            <div className="min-w-0 flex-1">
              {source.url ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-start gap-1.5 font-bengali text-bengali-sm text-content transition hover:text-accent"
                  lang="bn"
                >
                  <span className="underline decoration-rule underline-offset-[0.28em] transition group-hover:decoration-accent">
                    {source.label}
                  </span>
                  <ExternalLink className="mt-[0.3rem] h-3 w-3 shrink-0 opacity-50" />
                </a>
              ) : (
                <span className="font-bengali text-bengali-sm text-content" lang="bn">
                  {source.label}
                </span>
              )}

              {source.note && (
                <p
                  className="mt-1 font-bengali text-[0.9375rem] leading-relaxed text-content-faint"
                  lang="bn"
                >
                  {source.note}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>

      <T
        as="p"
        k="piece.sourcesNote"
        className="mt-6 font-sans text-[0.6875rem] leading-relaxed text-content-faint"
        bnClassName="font-bengali-sans"
      />
    </section>
  );
}
