import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatBengaliDate } from "@/lib/bengali";
import { KIND_META, piecePath } from "@/lib/nav";
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Overview & Analytics" };

export default async function AdminHomePage() {
  const recent = await prisma.piece.findMany({
    select: {
      id: true,
      slug: true,
      kind: true,
      status: true,
      titleBn: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-6">
        <div>
          <span className="label" lang="en">
            Admin Dashboard
          </span>
          <h1
            className="mt-2 font-bengali text-[1.75rem] font-medium text-content"
            lang="bn"
          >
            আজ কী লিখবেন?
          </h1>
        </div>

        <Link
          href="/admin/pieces/new"
          className="inline-flex items-center gap-1.5 rounded-sm bg-accent px-4 py-2 font-bengali text-[0.9375rem] text-surface transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          নতুন লেখা
        </Link>
      </div>

      {/* Interactive Analytics Dashboard */}
      <AnalyticsDashboard />

      {/* Recently Edited Section */}
      <div className="pt-4">
        <h2 className="label" lang="en">
          Recently edited
        </h2>
        <ul className="mt-4 divide-y divide-rule border-y border-rule">
          {recent.map((piece) => (
            <li
              key={piece.id}
              className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3"
            >
              <Link
                href={`/admin/pieces/${piece.id}`}
                className="font-bengali text-bengali-base text-content transition hover:text-accent"
                lang="bn"
              >
                {piece.titleBn}
              </Link>

              <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-content-faint">
                {KIND_META[piece.kind].labelEn}
              </span>

              {piece.status !== "PUBLISHED" && (
                <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-accent">
                  {piece.status}
                </span>
              )}

              <span className="ml-auto flex items-center gap-4">
                <span className="font-bengali text-xs text-content-faint">
                  {formatBengaliDate(piece.updatedAt)}
                </span>
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
              </span>
            </li>
          ))}

          {recent.length === 0 && (
            <li className="py-6 font-bengali text-bengali-sm text-content-soft" lang="bn">
              এখনও কিছু লেখা হয়নি। উপরের বোতাম থেকে শুরু করুন।
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
