"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, BookOpen, Headphones, Search, Users } from "lucide-react";
import { AnimatedNumber } from "@/components/admin/ui/animated-number";
import type { ReferenceActivity, ReferencePeriod } from "@/lib/reference-analytics";

const PERIODS: ReferencePeriod[] = ["7d", "30d", "90d", "all"];

export function ReferenceAnalyticsPanel() {
  const [period, setPeriod] = useState<ReferencePeriod>("30d");
  const [data, setData] = useState<ReferenceActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    fetch(`/api/admin/reference/analytics?period=${period}`, { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("analytics request failed"); return response.json(); })
      .then((result: { ok: boolean; data: ReferenceActivity }) => {
        if (!result.ok) throw new Error("analytics unavailable");
        setData(result.data);
      })
      .catch(() => { if (!controller.signal.aborted) setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [period]);

  const metrics = [
    { label: "Work opens", value: data?.workOpens ?? 0, icon: BookOpen },
    { label: "Reading starts", value: data?.readStarts ?? 0, icon: BookOpen },
    { label: "Listening starts", value: data?.listenStarts ?? 0, icon: Headphones },
    { label: "Unique sessions", value: data?.uniqueSessions ?? 0, icon: Users },
  ];
  const maxDaily = Math.max(1, ...(data?.trend.map((day) => day.opens + day.reads + day.listens) ?? []));

  return (
    <section aria-label="Reference activity" className="rounded-card border border-rule bg-surface-raised p-5 shadow-card sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-rule pb-4">
        <div>
          <span className="label">Reference intelligence</span>
          <h2 className="mt-1 font-serif text-xl text-content">How readers use the archive</h2>
          <p className="mt-1 text-xs text-content-soft">Measured page openings; data collection starts with this release.</p>
        </div>
        <div aria-label="Reference analytics period" className="flex gap-1 rounded-card border border-rule bg-surface p-1">
          {PERIODS.map((item) => (
            <button key={item} type="button" onClick={() => setPeriod(item)} aria-pressed={period === item}
              className={`rounded-card px-2.5 py-1.5 font-sans text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${period === item ? "bg-accent text-surface" : "text-content-soft hover:text-content"}`}>
              {item === "all" ? "All" : item}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="py-12 text-center text-sm text-content-soft" role="status">Loading reference activity…</p>}
      {error && !loading && <p className="py-12 text-center text-sm text-accent" role="alert">Reference analytics are unavailable. Try another period.</p>}
      {!loading && !error && data && (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-card border border-rule/70 bg-surface p-4 transition-colors duration-150 hover:border-accent/40">
                <div className="flex items-center justify-between text-content-faint"><span className="label">{label}</span><Icon className="h-4 w-4" aria-hidden /></div>
                <AnimatedNumber value={value} format={(number) => number.toLocaleString()} className="mt-3 block font-sans text-3xl font-medium text-content" />
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-card border border-rule/70 bg-surface p-4">
              <div className="flex items-center justify-between gap-2"><h3 className="font-sans text-sm font-medium text-content">Activity over time</h3><Activity className="h-4 w-4 text-content-faint" aria-hidden /></div>
              {data.trend.length ? (
                <div className="mt-5 flex h-36 items-end gap-1.5" role="img" aria-label="Daily reference opens, reading starts, and listening starts">
                  {data.trend.map((day) => (
                    <div key={day.date} className="group relative flex h-full min-w-1 flex-1 flex-col justify-end" title={`${day.date}: ${day.opens} opens, ${day.reads} reads, ${day.listens} listens`}>
                      <div className="rounded-t-sm bg-accent/80 transition-colors duration-150 group-hover:bg-accent" style={{ height: `${Math.max(4, ((day.opens + day.reads + day.listens) / maxDaily) * 100)}%` }} />
                    </div>
                  ))}
                </div>
              ) : <p className="mt-5 flex h-36 items-center justify-center text-sm text-content-faint">No reference activity yet</p>}
              <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-rule/60 pt-3 font-sans text-xs text-content-soft">
                <span>{data.catalogueViews.toLocaleString()} catalogue visits</span>
                <span className="inline-flex items-center gap-1"><Search className="h-3 w-3" aria-hidden />{data.searches.toLocaleString()} searches</span>
              </div>
            </div>

            <div className="rounded-card border border-rule/70 bg-surface p-4">
              <h3 className="font-sans text-sm font-medium text-content">Most opened works</h3>
              {data.topWorks.length ? (
                <ol className="mt-3 divide-y divide-rule/60">
                  {data.topWorks.map((work, index) => (
                    <li key={work.id} className="flex items-center gap-3 py-2.5 text-xs">
                      <span className="w-4 shrink-0 font-mono text-content-faint">{index + 1}</span>
                      <Link href={`/reference/${work.slug}`} className="min-w-0 flex-1 truncate font-bengali text-sm text-content hover:text-accent">{work.titleBn}</Link>
                      <span className="shrink-0 font-mono text-content-soft" title={`${work.reads} reads · ${work.listens} listens`}>{work.opens} opens</span>
                    </li>
                  ))}
                </ol>
              ) : <p className="mt-5 text-sm text-content-faint">Work rankings appear after readers open a reference.</p>}
            </div>
          </div>
          <p className="mt-4 text-[11px] text-content-faint">Unique sessions count anonymous browser sessions. Counts may include repeat visits and exclude readers who disable tracking.</p>
        </>
      )}
    </section>
  );
}
