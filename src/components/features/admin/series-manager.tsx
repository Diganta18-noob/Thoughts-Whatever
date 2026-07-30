"use client";

import { useState } from "react";
import { Series, Article } from "@/types/database";
import { Plus, Layers, Check, MoveVertical } from "lucide-react";

export function SeriesManager({
  seriesList,
  articles,
}: {
  seriesList: Series[];
  articles: Article[];
}) {
  const [list, setList] = useState<Series[]>(seriesList);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleCreateSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    const newSeries: Series = {
      id: `series-${Date.now()}`,
      title,
      slug: title.toLowerCase().replace(/\s+/g, "-"),
      description,
      thumbnail_url: thumbnailUrl || "https://images.unsplash.com/photo-1590732414187-5763a8d4a6f9?auto=format&fit=crop&w=1200&q=80",
      total_parts: 1,
    };
    setList([newSeries, ...list]);
    setShowForm(false);
    setTitle("");
    setDescription("");
    setThumbnailUrl("");
    setSuccessMsg("নতুন সিরিজ সফলভাবে তৈরি হয়েছে!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 font-heading text-sm flex items-center gap-2">
          <Check className="w-5 h-5" /> {successMsg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold font-heading flex items-center gap-2">
          <Layers className="w-5 h-5 text-red-600" />
          ডকুমেন্টারি সিরিজ তালিকা ({list.length})
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-heading font-semibold text-xs flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> নতুন সিরিজ তৈরি করুন
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateSeries} className="p-5 rounded-2xl bg-card border border-border space-y-4">
          <h4 className="text-sm font-bold font-heading">নতুন সিরিজের তথ্য</h4>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="সিরিজের নাম (যেমন: বাংলার হারিয়ে যাওয়া দুর্গ)"
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs font-heading"
            required
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="সিরিজের সংক্ষিপ্ত পরিচিতি..."
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs font-body"
            required
          />
          <input
            type="url"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
            placeholder="সিরিজের ব্যাডজ বা থাম্বনেইল ইউআরএল..."
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs font-mono"
          />
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-heading font-bold text-xs"
          >
            তৈরি নিশ্চিত করুন
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map((s) => {
          const seriesArticles = articles.filter((a) => a.series_id === s.id);
          return (
            <div key={s.id} className="p-4 rounded-2xl bg-card border border-border space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <img src={s.thumbnail_url} alt={s.title} className="w-16 h-16 rounded-xl object-cover" />
                  <div>
                    <h4 className="text-base font-bold font-heading">{s.title}</h4>
                    <p className="text-xs text-muted-foreground font-body line-clamp-2">{s.description}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border/60">
                <span className="text-xs font-bold font-heading text-muted-foreground block mb-2">
                  সংযুক্ত পর্বসমূহ ({seriesArticles.length} টি পর্ব):
                </span>
                <div className="space-y-1.5">
                  {seriesArticles.map((art) => (
                    <div
                      key={art.id}
                      className="flex items-center justify-between text-xs font-heading bg-secondary/50 px-3 py-1.5 rounded-lg"
                    >
                      <span className="truncate max-w-[240px]">
                        পর্ব {art.part_number}: {art.title}
                      </span>
                      <MoveVertical className="w-3.5 h-3.5 text-muted-foreground cursor-grab" />
                    </div>
                  ))}
                  {seriesArticles.length === 0 && (
                    <span className="text-[11px] text-muted-foreground font-heading">
                      এখনো কোনো নিবন্ধ সংযুক্ত করা হয়নি।
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
