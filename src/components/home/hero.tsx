"use client";

import Link from "next/link";
import { useProgress } from "@/components/providers/progress-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { SplitText } from "@/components/motion/split-text";
import { Reveal } from "@/components/motion/reveal";
import { Magnetic } from "@/components/motion/magnetic";
import { siteConfig } from "@/lib/utils";
import { KIND_META } from "@/lib/nav";

export function Hero() {
  const { lastRead, ready } = useProgress();
  const { t, locale, isBn } = useLanguage();

  const resumeHref =
    ready && lastRead
      ? `${KIND_META[lastRead.kind as keyof typeof KIND_META].path}/${lastRead.slug}`
      : null;

  const face = isBn ? "font-bengali" : "font-serif";

  return (
    <section className="relative flex min-h-[min(100svh,900px)] flex-col items-center justify-center overflow-hidden px-4 pb-20 pt-24 sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgb(var(--surface-raised)/0.9),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-multiply dark:mix-blend-screen"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div aria-hidden className="home-hero-aura pointer-events-none absolute left-1/2 top-[42%] h-[min(76vw,760px)] w-[min(76vw,760px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/[0.08] bg-[radial-gradient(circle,rgb(var(--accent)/0.08)_0%,transparent_67%)]" />

      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center text-center">
        <Reveal>
          <div className="flex items-center justify-center gap-4">
            <span aria-hidden className="h-px w-8 bg-accent/50 sm:w-14" />
            <p className={`text-xs uppercase tracking-[0.25em] text-accent ${isBn ? "font-bengali-sans normal-case tracking-normal" : "font-mono"}`} lang={locale}>
              {isBn ? siteConfig.tagline : siteConfig.taglineEn}
            </p>
            <span aria-hidden className="h-px w-8 bg-accent/50 sm:w-14" />
          </div>
        </Reveal>

        <SplitText
          as="h1"
          lang="en"
          text={siteConfig.name}
          delay={0.15}
          className="mt-8 max-w-full whitespace-nowrap font-display text-[clamp(2.25rem,7vw,7.5rem)] leading-[1.08] tracking-tight text-content"
        />

        <Reveal delay={0.35}>
          <p
            className="mt-7 max-w-2xl font-bengali text-sm leading-relaxed text-content-soft sm:text-lg"
            lang="bn"
          >
            বাংলা সাহিত্য নিয়ে পূর্ণাঙ্গ লেখা, পাঠ-পর্যালোচনা ও তথ্যচিত্র। রিলের পিছনের সম্পূর্ণ রচনা ও গবেষণাপত্র।
          </p>
        </Reveal>

        <Reveal delay={0.65}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-4">
            {resumeHref && lastRead && (
              <Magnetic>
                <Link
                  href={resumeHref}
                  className={`inline-flex items-center gap-2.5 rounded-sm bg-accent px-6 py-3 text-sm font-medium text-white transition hover:opacity-90 ${face}`}
                  lang={locale}
                >
                  {t("home.continueReading")}
                  <span className="font-bengali opacity-70" lang="bn">
                    — {lastRead.titleBn}
                  </span>
                </Link>
              </Magnetic>
            )}

            <Magnetic>
              <Link
                href="/series"
                className={`inline-flex min-h-12 items-center justify-center rounded-sm bg-accent px-7 py-3 text-sm font-medium text-white shadow-sm transition-[transform,background-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:bg-accent/90 hover:shadow-lg active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${face}`}
                lang={locale}
              >
                {t("home.latestSeries")}
              </Link>
            </Magnetic>

            <Magnetic>
              <Link
                href="/archive"
                className={`group inline-flex items-center gap-1.5 rounded-sm border border-transparent px-6 py-3 text-sm text-content-soft transition-colors hover:border-rule hover:text-content focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${face}`}
                lang={locale}
              >
                <span>{t("home.exploreArchive")}</span>
                <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
            </Magnetic>
          </div>
        </Reveal>
      </div>

      <Link href="#featured-stories" className="group absolute bottom-14 z-10 flex items-center gap-3 font-mono text-[0.65rem] uppercase tracking-[0.22em] text-content-faint transition-colors hover:text-accent focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:bottom-20" aria-label="Scroll to featured stories">
        <span aria-hidden className="home-scroll-line block h-8 w-px origin-top bg-accent" />
        <span>Explore the collection</span>
        <span aria-hidden className="transition-transform duration-300 group-hover:translate-y-1">↓</span>
      </Link>
    </section>
  );
}
