import { T } from "@/components/i18n/t";

export type TimelineItem = {
  id: string;
  year: string;
  labelBn: string;
  descBn?: string | null;
};

/**
 * কালরেখা — the chronology behind a documentary piece.
 *
 * `year` is a string, not a number, because the honest answer is often a range
 * ("১৯৪৩–৪৪") or an approximation. Forcing it into an integer would mean
 * either lying about precision or dropping the entry.
 */
export function Timeline({ events }: { events: TimelineItem[] }) {
  if (!events.length) return null;

  return (
    <section className="mt-14 border-t border-rule pt-8" aria-labelledby="timeline">
      <h2 id="timeline" className="mb-6 text-lg text-content">
        <T k="piece.timeline" className="font-serif" bnClassName="font-bengali" />
      </h2>

      <ol className="relative border-l border-rule pl-6">
        {events.map((event) => (
          <li key={event.id} className="relative pb-7 last:pb-0">
            <span
              aria-hidden
              className="absolute -left-[1.8125rem] top-[0.45rem] h-[7px] w-[7px] rounded-full bg-accent ring-4 ring-surface"
            />
            <div className="font-mono text-xs tracking-wide text-accent">
              {event.year}
            </div>
            <h3
              className="mt-1 font-bengali text-[1.0625rem] leading-snug text-content"
              lang="bn"
            >
              {event.labelBn}
            </h3>
            {event.descBn && (
              <p
                className="mt-1.5 font-bengali text-[0.9375rem] leading-relaxed text-content-soft"
                lang="bn"
              >
                {event.descBn}
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
