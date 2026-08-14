import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { getFilterFacets } from "@/lib/pieces";
import { T } from "@/components/i18n/t";
import { Count, Num } from "@/components/i18n/values";
import { withTimeout } from "@/lib/utils";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "লেখকেরা",
  description: "যাঁদের নিয়ে লেখা — এক জায়গায়।",
  alternates: { canonical: "/authors" },
};

export default async function AuthorsPage() {
  const { authors } = await withTimeout(
    getFilterFacets(),
    { authors: [], tags: [], years: [] },
    5000
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <PageHeader
        labelEn="Authors"
        titleBn="লেখকেরা"
        descBn="যাঁদের লেখা নিয়ে এখানে কথা হয়েছে। নামে ক্লিক করলে সেই লেখককে নিয়ে সব লেখা এক জায়গায়।"
        descEn="Everyone written about here"
        count={<Count k="authors.count" value={authors.length} />}
      />

      {authors.length === 0 ? (
        <T
          as="p"
          k="empty.noAuthors"
          className="py-24 text-center text-bengali-base text-content-faint"
          bnClassName="font-bengali"
        />
      ) : (
        <ul className="grid gap-x-8 gap-y-1 py-10 sm:grid-cols-2 lg:grid-cols-3">
          {authors.map((author) => (
            <li key={author.slug} className="border-b border-rule">
              <Link
                href={`/authors/${author.slug}`}
                className="group flex items-baseline justify-between gap-3 py-3"
              >
                <span className="min-w-0">
                  <span
                    className="block font-bengali text-[1.0625rem] text-content transition-colors group-hover:text-accent"
                    lang="bn"
                  >
                    {author.nameBn}
                  </span>
                  {author.era && (
                    <span className="font-mono text-[0.6875rem] text-content-faint">
                      {author.era}
                    </span>
                  )}
                </span>
                <Num
                  value={author._count.pieces}
                  className="shrink-0 text-xs text-content-faint"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
