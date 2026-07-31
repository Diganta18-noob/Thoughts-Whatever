"use client";

import { Bookmark as BookmarkIcon, BookmarkCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useBookmarks } from "@/components/providers/bookmarks-provider";
import { cn } from "@/lib/utils";

export function BookmarkButton({
  slug,
  kind,
  titleBn,
  withLabel = false,
}: {
  slug: string;
  kind: "RACHANA" | "BLOG" | "DOCUMENTARY";
  titleBn: string;
  withLabel?: boolean;
}) {
  const { has, toggle, ready } = useBookmarks();
  const saved = ready && has(slug);

  return (
    <button
      type="button"
      data-print="hide"
      onClick={() => {
        const nowSaved = toggle({ slug, kind, titleBn });
        toast(nowSaved ? "পরে পড়ার তালিকায় যোগ হল" : "তালিকা থেকে সরানো হল");
      }}
      aria-pressed={saved}
      title={saved ? "পরে পড়ব — সংরক্ষিত" : "পরে পড়ব"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-xs transition",
        saved
          ? "border-accent/50 bg-accent/5 text-accent"
          : "border-rule text-content-soft hover:border-content-faint hover:text-content",
      )}
    >
      {saved ? (
        <BookmarkCheck className="h-3.5 w-3.5" />
      ) : (
        <BookmarkIcon className="h-3.5 w-3.5" />
      )}
      {withLabel && (
        <span className="font-bengali-sans">{saved ? "সংরক্ষিত" : "পরে পড়ব"}</span>
      )}
    </button>
  );
}
