"use client";

import Link from "next/link";
import { Article } from "@/types/database";
import { Clock, Sparkles, ArrowRight } from "lucide-react";
import { InstagramIcon } from "@/components/shared/brand-icons";
import { motion } from "framer-motion";

export function HeroSection({ article }: { article: Article }) {
  if (!article) return null;

  return (
    <section className="relative overflow-hidden rounded-3xl mb-14 shadow-2xl border border-border">
      <div className="relative min-h-[480px] lg:min-h-[560px] flex items-end">
        {/* Hero Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-1000"
          style={{ backgroundImage: `url(${article.thumbnail_url})` }}
        />

        {/* Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />

        {/* Hero Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 p-6 sm:p-10 lg:p-14 max-w-4xl text-white space-y-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold font-heading bg-amber-500 text-stone-950 uppercase tracking-wide flex items-center gap-1 shadow-md">
              <Sparkles className="w-3.5 h-3.5" /> বিশেষ ফিচারড ডকুমেন্টারি
            </span>
            {article.category && (
              <span className="px-3 py-1 rounded-full text-xs font-heading font-medium bg-white/20 backdrop-blur-md text-stone-100">
                {article.category.name}
              </span>
            )}
            {article.series && (
              <span className="px-3 py-1 rounded-full text-xs font-heading font-medium bg-red-600/80 backdrop-blur-md text-white">
                সিরিজ: {article.series.title} (পর্ব {article.part_number})
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading leading-tight tracking-tight text-stone-50 drop-shadow-md">
            {article.title}
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-stone-300 line-clamp-3 leading-relaxed font-body font-normal max-w-3xl">
            {article.excerpt}
          </p>

          <div className="flex flex-wrap items-center gap-6 pt-3 text-xs sm:text-sm text-stone-300 font-heading">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>পড়ার সময় {article.reading_time_minutes} মিনিট</span>
            </div>

            {article.instagram_link && (
              <div className="flex items-center gap-1.5 text-pink-400 font-medium">
                <InstagramIcon className="w-4 h-4" />
                <span>ইনস্টাগ্রাম রিল কানেক্টেড</span>
              </div>
            )}
          </div>

          <div className="pt-4 flex flex-wrap gap-4">
            <Link
              href={`/article/${article.slug}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-red-600 to-amber-600 text-white font-heading font-bold text-sm shadow-lg hover:shadow-xl hover:scale-102 transition-all"
            >
              সম্পূর্ণ নিবন্ধ পড়ুন <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
