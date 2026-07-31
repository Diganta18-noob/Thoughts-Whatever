"use client";

import { formatBengaliDate, toBengaliNumber } from "@/lib/bengali";
import { useTranslation } from "@/components/providers/language-provider";

type SubscriberRow = {
  id: string;
  email: string;
  nameBn: string | null;
  source: string | null;
  createdAt: Date | string;
  unsubscribedAt: Date | string | null;
};

export function SubscribersClient({
  active,
  gone,
  recent,
}: {
  active: number;
  gone: number;
  recent: SubscriberRow[];
}) {
  const t = useTranslation();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="label" lang="en">
            Letter · {toBengaliNumber(active)}
          </span>
          <h1 className="mt-2 text-[1.75rem] font-medium text-content">
            {t("admin.subscribers.heading")}
          </h1>
        </div>

        {/* A plain link, not fetch(): the browser handles the download and the
            file never passes through React. */}
        <a
          href="/api/admin/subscribers"
          className="rounded-sm border border-rule px-4 py-2 font-serif text-sm text-content-soft transition hover:border-accent/50 hover:text-accent"
          lang="en"
        >
          Download CSV
        </a>
      </div>

      <p className="mt-4 max-w-measure text-sm text-content-soft">
        {t("admin.subscribers.description")}
        {gone > 0 && (
          <> {t("admin.subscribers.unsubscribed", { count: gone })}</>
        )}
      </p>

      <ul className="mt-8 divide-y divide-rule border-y border-rule">
        {recent.map((subscriber) => (
          <li
            key={subscriber.id}
            className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3"
          >
            <span className="font-mono text-[0.8125rem] text-content">
              {subscriber.email}
            </span>
            {subscriber.nameBn && (
              <span className="font-bengali text-[0.875rem] text-content-soft">
                {subscriber.nameBn}
              </span>
            )}
            {subscriber.unsubscribedAt && (
              <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-accent">
                left
              </span>
            )}
            <span className="ml-auto flex items-center gap-4 font-mono text-[0.6875rem] text-content-faint">
              {subscriber.source && <span>{subscriber.source}</span>}
              <span className="font-bengali">
                {formatBengaliDate(subscriber.createdAt)}
              </span>
            </span>
          </li>
        ))}

        {recent.length === 0 && (
          <li className="py-8 text-sm text-content-soft">
            {t("admin.subscribers.emptyList")}
          </li>
        )}
      </ul>
    </div>
  );
}
