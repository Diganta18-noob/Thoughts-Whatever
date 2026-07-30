"use client";

import Link from "next/link";
import { Series } from "@/types/database";
import { Layers, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

export function FeaturedCarousel({ series }: { series: Series[] }) {
  if (!series || series.length === 0) return null;

  return (
    <section id="series" className="mb-14">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold font-heading flex items-center gap-2">
            <Layers className="w-6 h-6 text-red-600" />
            ডকুমেন্টারি সিরিজসমূহ
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground font-heading mt-1">
            ধাবাহিক পর্ব ও ইতিহাস অনুসন্ধানের বিশেষ সংকলন
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {series.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
          >
            <Link
              href={`/series/${item.slug}`}
              className="group block relative overflow-hidden rounded-2xl glass-panel p-5 border border-border hover:border-primary/50 transition-all hover:shadow-xl"
            >
              <div className="relative h-44 rounded-xl overflow-hidden mb-4">
                <img
                  src={item.thumbnail_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold font-heading bg-red-600 text-white shadow-md">
                  {item.total_parts} টি পর্ব
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold font-heading group-hover:text-primary transition-colors flex items-center justify-between">
                  <span>{item.title}</span>
                  <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-body">
                  {item.description}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
