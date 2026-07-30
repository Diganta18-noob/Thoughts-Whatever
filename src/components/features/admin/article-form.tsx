"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Article, Category, Series } from "@/types/database";
import { slugifyBengali } from "@/lib/utils/slugify";
import { calculateReadingTime } from "@/lib/utils/reading-time";
import { Upload, Save, Eye, Check, AlertCircle } from "lucide-react";

export function ArticleForm({
  initialData,
  categories,
  seriesList,
}: {
  initialData?: Partial<Article>;
  categories: Category[];
  seriesList: Series[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [thumbnailUrl, setThumbnailUrl] = useState(initialData?.thumbnail_url || "");
  const [instagramLink, setInstagramLink] = useState(initialData?.instagram_link || "");
  const [categoryId, setCategoryId] = useState(initialData?.category_id || categories[0]?.id || "");
  const [seriesId, setSeriesId] = useState(initialData?.series_id || "");
  const [partNumber, setPartNumber] = useState(initialData?.part_number || 1);
  const [tags, setTags] = useState(initialData?.tags?.join(", ") || "");
  const [isFeatured, setIsFeatured] = useState(initialData?.is_featured || false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!initialData?.id) {
      setSlug(slugifyBengali(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");

    const payload = {
      id: initialData?.id || `art-${Date.now()}`,
      title,
      slug: slug || slugifyBengali(title),
      excerpt,
      content,
      thumbnail_url: thumbnailUrl || "https://images.unsplash.com/photo-1590732414187-5763a8d4a6f9?auto=format&fit=crop&w=1200&q=80",
      instagram_link: instagramLink,
      category_id: categoryId,
      series_id: seriesId || undefined,
      part_number: seriesId ? Number(partNumber) : undefined,
      published_at: initialData?.published_at || new Date().toISOString(),
      is_published: true,
      is_featured: isFeatured,
      view_count: initialData?.view_count || 0,
      reading_time_minutes: calculateReadingTime(content),
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
    };

    try {
      const res = await fetch("/api/admin/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccessMsg("নিবন্ধ সফলভাবে সংরক্ষণ ও প্রকাশিত হয়েছে!");
        setTimeout(() => router.push("/admin/articles"), 1500);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 font-heading text-sm flex items-center gap-2">
          <Check className="w-5 h-5" /> {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-5">
          <div>
            <label className="block text-xs font-bold font-heading uppercase mb-1">
              নিবন্ধের শিরোনাম (বাংলায়) *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="যেমন: সোনারগাঁও: ঈশা খাঁর রাজধানী ও মসলিনের গৌরবগাথা"
              className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-sm font-heading font-semibold focus:outline-hidden focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold font-heading uppercase mb-1">
              ইউআরএল স্লাগ (Slug)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-secondary/50 border border-border text-xs font-mono text-muted-foreground"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold font-heading uppercase mb-1">
              সংক্ষিপ্ত বিবরণ (Excerpt) *
            </label>
            <textarea
              rows={3}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="প্রচ্ছদে ও অনুসন্ধানে দেখানোর জন্য ২-৩ লাইনের সংক্ষেপ..."
              className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-xs font-body focus:outline-hidden focus:ring-1 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold font-heading uppercase mb-1">
              মূল বিষয়বস্তু ও নথি (Markdown/Bengali Text) *
            </label>
            <textarea
              rows={14}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="এখানে আপনার নিবন্ধের সম্পূর্ণ স্ক্রিপ্ট, সাব-হেডিং, উক্তি ও ছবি মার্কডাউন ফরম্যাটে লিখুন..."
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm font-body leading-relaxed focus:outline-hidden focus:ring-1 focus:ring-primary"
              required
            />
            <p className="text-[11px] text-muted-foreground font-heading mt-1">
              আনুমানিক পড়ার সময়: {calculateReadingTime(content)} মিনিট
            </p>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-5">
          <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
            <h4 className="text-sm font-bold font-heading border-b border-border pb-2">মেটাডেটা ও সেটিংস</h4>

            <div>
              <label className="block text-xs font-bold font-heading uppercase mb-1">বিভাগ (Category)</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs font-heading"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold font-heading uppercase mb-1">ডকুমেন্টারি সিরিজ (ঐচ্ছিক)</label>
              <select
                value={seriesId}
                onChange={(e) => setSeriesId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs font-heading"
              >
                <option value="">কোনো সিরিজ নেই</option>
                {seriesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>

            {seriesId && (
              <div>
                <label className="block text-xs font-bold font-heading uppercase mb-1">পর্ব নম্বর (Part Number)</label>
                <input
                  type="number"
                  min={1}
                  value={partNumber}
                  onChange={(e) => setPartNumber(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs font-heading"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold font-heading uppercase mb-1">থাম্বনেইল ইমেজ ইউআরএল</label>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs font-mono"
              />
              {thumbnailUrl && (
                <div className="mt-2 h-24 rounded-lg overflow-hidden border border-border">
                  <img src={thumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold font-heading uppercase mb-1">ইনস্টাগ্রাম রিল লিঙ্ক</label>
              <input
                type="url"
                value={instagramLink}
                onChange={(e) => setInstagramLink(e.target.value)}
                placeholder="https://www.instagram.com/reel/..."
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold font-heading uppercase mb-1">ট্যাগসমূহ (কমা দিয়ে পৃথকীকৃত)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="ইতিহাস, রিল, প্রত্নতত্ত্ব"
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs font-heading"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isFeatured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="isFeatured" className="text-xs font-bold font-heading">
                প্রচ্ছদে ফিচারড রাখুন
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-heading font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? "সংরক্ষণ হচ্ছে..." : "নিবন্ধ প্রকাশ করুন"}
          </button>
        </div>
      </div>
    </form>
  );
}
