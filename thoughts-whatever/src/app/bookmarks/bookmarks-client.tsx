"use client";

import Link from "next/link";
import { Trash2, X } from "lucide-react";
import { useBookmarks } from "@/components/providers/bookmarks-provider";
import { formatBengaliDate, toBengaliNumber } from "@/lib/bengali";
import { KIND_META, piecePath } from "@/lib/nav";

export function BookmarksClient() {
  const { bookmarks, remove, clear, ready } = useBookmarks();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
      <header className="border-b border-rule pb-8 pt-12 sm:pt-16">
        <div className="flex items-baseline justify-between gap-4">
          <span className="label" lang="en">
            Saved
          </span>
          {ready && bookmarks.length > 0 && (
            <button
              type="button"
              onClick={clear}
              className="label flex items-center gap-1.5 transition hover:!text-accent"
            >
              <Trash2 className="h-3 w-3" />
              Clear all
            </button>
          )}
        </div>

        <h1
          className="mt-3 font-bengali text-[2rem] font-medium leading-tight text-content sm:text-[2.5rem]"
          lang="bn"
        >
          পরে পড়ব
        </h1>

        <p
          className="mt-4 max-w-measure-wide font-bengali text-bengali-sm text-content-soft"
          lang="bn"
        >
          এই তালিকা আপনার নিজের ব্রাউজারে রাখা — আমাদের কাছে যায় না। তাই অন্য
          ফোনে বা অন্য ব্রাউজারে এটা দেখা যাবে না, আর ব্রাউজারের ডেটা মুছলে
          তালিকাও মুছে যাবে।
        </p>
      </header>

      {!ready ? (
        <div className="py-24" aria-hidden />
      ) : bookmarks.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-bengali text-bengali-base text-content-soft" lang="bn">
            এখনও কিছু সংরক্ষণ করা হয়নি।
          </p>
          <p className="mt-2 font-bengali text-bengali-sm text-content-faint" lang="bn">
            যেকোনও লেখার উপরে বুকমার্ক আইকনে ক্লিক করলে সেটা এখানে জমা থাকবে।
          </p>
          <Link
            href="/writing"
            className="mt-5 inline-block font-serif text-sm text-accent hover:opacity-75"
            lang="en"
          >
            Start reading →
          </Link>
        </div>
      ) : (
        <>
          <p className="pt-6 label">{toBengaliNumber(bookmarks.length)} টি</p>
          <ol className="divide-y divide-rule">
            {bookmarks.map((bookmark) => (
              <li key={bookmark.slug} className="flex items-start gap-4 py-5">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-3">
                    <span className="label !text-accent">
                      {KIND_META[bookmark.kind].labelBn}
                    </span>
                    <span className="label">
                      {formatBengaliDate(new Date(bookmark.savedAt))}
                    </span>
                  </div>
                  <Link
                    href={piecePath(bookmark.kind, bookmark.slug)}
                    className="font-bengali text-lg leading-snug text-content transition-colors hover:text-accent"
                    lang="bn"
                  >
                    {bookmark.titleBn}
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => remove(bookmark.slug)}
                  aria-label={`${bookmark.titleBn} — তালিকা থেকে সরান`}
                  className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-content-faint transition hover:bg-content/5 hover:text-content"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
