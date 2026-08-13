"use client";

import { motion } from "framer-motion";
import { T } from "@/components/i18n/t";
import { Count, Num } from "@/components/i18n/values";

export interface HomeHeroProps {
  today?: { formatted: string; season: string } | null;
  totalPieces: number;
}

export function HomeHero({ today, totalPieces }: HomeHeroProps) {
  return (
    <section className="pt-8 pb-12 text-center max-w-4xl mx-auto px-4">
      {/* Small Category / Subtitle Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4 inline-flex items-center gap-2 rounded-full border border-rule/80 bg-surface-raised/40 px-3.5 py-1 text-xs tracking-widest text-content-soft font-sans uppercase"
      >
        <span>Bengali Literature</span>
        <span className="text-accent">•</span>
        <span>Essays</span>
        <span className="text-accent">•</span>
        <span>Documentary</span>
      </motion.div>

      {/* Main Large Editorial Title */}
      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-content tracking-tight mb-6"
      >
        thoughts.whatever
      </motion.h1>

      {/* Dateline & Article Count */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="mt-6 flex items-center justify-center gap-3 text-xs text-content-faint font-bengali-sans"
        lang="bn"
      >
        {today && <span>{today.formatted} · {today.season}</span>}
        {today && <span className="text-rule">·</span>}
        <span><Count k="common.count" value={totalPieces} /></span>
      </motion.div>
    </section>
  );
}
