import { prisma } from "@/lib/prisma";
import { formatBengaliDate, toBengaliNumber } from "@/lib/bengali";

export const dynamic = "force-dynamic";

export const metadata = { title: "Letter" };

export default async function SubscribersPage() {
  const [active, gone, recent] = await Promise.all([
    prisma.subscriber.count({ where: { unsubscribedAt: null } }),
    prisma.subscriber.count({ where: { unsubscribedAt: { not: null } } }),
    prisma.subscriber.findMany({
      select: {
        id: true,
        email: true,
        nameBn: true,
        source: true,
        createdAt: true,
        unsubscribedAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="label" lang="en">
            Letter · {toBengaliNumber(active)}
          </span>
          <h1
            className="mt-2 font-bengali text-[1.75rem] font-medium text-content"
            lang="bn"
          >
            চিঠির তালিকা
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

      <p
        className="mt-4 max-w-measure font-bengali text-bengali-sm text-content-soft"
        lang="bn"
      >
        চিঠি পাঠানোর কাজটা এই সাইট করে না — তালিকাটা নামিয়ে নিয়ে যে মেল টুল
        আপনি ব্যবহার করেন, সেখানে দিলেই হবে।
        {gone > 0 && (
          <> এখন পর্যন্ত {toBengaliNumber(gone)} জন নাম কাটিয়েছেন।</>
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
          <li
            className="py-8 font-bengali text-bengali-sm text-content-soft"
            lang="bn"
          >
            এখনও কেউ নাম লেখায়নি।
          </li>
        )}
      </ul>
    </div>
  );
}
