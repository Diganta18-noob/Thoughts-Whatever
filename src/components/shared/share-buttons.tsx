"use client";

import { useState } from "react";
import { Share2, Bookmark, Check, Link2 } from "lucide-react";
import { FacebookIcon, TwitterIcon } from "@/components/shared/brand-icons";

export function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = JSON.parse(localStorage.getItem("bengali_doc_bookmarks") || "[]");
      return saved.includes(slug);
    }
    return false;
  });

  const url = typeof window !== "undefined" ? `${window.location.origin}/article/${slug}` : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleBookmark = () => {
    const saved = JSON.parse(localStorage.getItem("bengali_doc_bookmarks") || "[]");
    let updated: string[];
    if (saved.includes(slug)) {
      updated = saved.filter((s: string) => s !== slug);
      setBookmarked(false);
    } else {
      updated = [...saved, slug];
      setBookmarked(true);
    }
    localStorage.setItem("bengali_doc_bookmarks", JSON.stringify(updated));
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
  };

  const shareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  return (
    <div className="flex items-center gap-2 py-4 border-y border-border my-6 no-print">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mr-2 font-heading">
        <Share2 className="w-3.5 h-3.5" /> শেয়ার করুন:
      </span>
      <button
        onClick={shareFacebook}
        className="p-2 rounded-full bg-blue-600/10 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors"
        title="ফেসবুকে শেয়ার করুন"
      >
        <FacebookIcon className="w-4 h-4" />
      </button>
      <button
        onClick={shareTwitter}
        className="p-2 rounded-full bg-sky-500/10 text-sky-500 hover:bg-sky-500 hover:text-white transition-colors"
        title="টুইটারে শেয়ার করুন"
      >
        <TwitterIcon className="w-4 h-4" />
      </button>
      <button
        onClick={handleCopy}
        className="p-2 rounded-full bg-secondary text-foreground hover:bg-muted transition-colors flex items-center gap-1 text-xs"
        title="লিঙ্ক কপি করুন"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Link2 className="w-4 h-4" />}
      </button>
      <div className="ml-auto">
        <button
          onClick={toggleBookmark}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-heading font-medium transition-colors ${
            bookmarked
              ? "bg-amber-500 text-stone-950 font-semibold"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${bookmarked ? "fill-current" : ""}`} />
          {bookmarked ? "সংরক্ষিত" : "সংরক্ষণ করুন"}
        </button>
      </div>
    </div>
  );
}
