"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/components/providers/language-provider";
import { duration, ease, viewport } from "@/components/motion/motion-tokens";
import { piecePath, type PieceKindKey } from "@/lib/nav";
import type { PullQuote } from "@/lib/markdown";

export function Quote({ quote }: { quote: PullQuote | null }) {
  const reduced = useReducedMotion();
  const { locale, isBn } = useLanguage();

  if (!quote) return null;

  const href = piecePath(quote.kind as PieceKindKey, quote.slug);

  return (
    <section className="relative flex min-h-[70svh] items-center justify-center py-section-lg">
      <figure className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 font-display text-[8rem] leading-none text-gold/20 sm:-top-12 sm:text-[12rem]"
        >
          &ldquo;
        </span>

        <motion.blockquote
          data-reveal
          className="relative font-bengali text-step-5 font-light leading-[1.4] text-content"
          lang="bn"
          {...(reduced
            ? {}
            : {
                initial: { clipPath: "inset(0 100% 0 0)", opacity: 0 },
                whileInView: { clipPath: "inset(0 0% 0 0)", opacity: 1 },
                viewport,
                transition: { duration: duration.grand, ease: ease.entrance },
              })}
        >
          {quote.text}
        </motion.blockquote>

        <figcaption className="mt-8">
          <Link
            href={href}
            className={`inline-flex items-center gap-2 text-sm text-content-faint transition hover:text-accent ${isBn ? "font-bengali" : "font-serif"}`}
            lang={locale}
          >
            <span className="font-bengali" lang="bn">
              {quote.titleBn}
            </span>
            <span aria-hidden>→</span>
          </Link>
        </figcaption>
      </figure>
    </section>
  );
}
