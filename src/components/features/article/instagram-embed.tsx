"use client";

import { ExternalLink } from "lucide-react";
import { InstagramIcon } from "@/components/shared/brand-icons";

export function InstagramEmbed({
  url,
  articleId,
}: {
  url: string;
  articleId: string;
}) {
  if (!url) return null;

  const trackInstagramClick = async () => {
    try {
      await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article_id: articleId,
          event_type: "instagram_click",
          session_id: localStorage.getItem("bengali_doc_session") || "anon",
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="my-8 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-amber-500/10 border border-pink-500/20 p-6 no-print">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md shrink-0">
            <InstagramIcon className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold font-heading">ইনস্টাগ্রাম রিল ভিডিও সাথী</h4>
            <p className="text-xs text-muted-foreground font-body">
              এই নিবন্ধের সঙ্গে সম্পর্কিত মূল ভিডিও ফুটেজ ও রিল ইনস্টাগ্রামে দেখুন।
            </p>
          </div>
        </div>

        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          onClick={trackInstagramClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-heading font-semibold text-xs shadow-md hover:shadow-lg transition-all shrink-0"
        >
          ইনস্টাগ্রামে রিল খুলুন <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
