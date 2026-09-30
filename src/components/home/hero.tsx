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
    <section className="editorial-hero relative flex min-h-[78svh] flex-col items-center justify-center overflow-hidden px-4 py-20 sm:px-6 sm:py-28">
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

      <div className="relative z-10 flex w-full max-w-5xl flex-col items-center text-center">
        <Reveal>
          <p
            className={`inline-flex items-center gap-3 text-xs tracking-[0.2em] uppercase text-gold ${isBn ? "font-bengali-sans normal-case tracking-normal" : "font-mono"}`}
            lang={locale}
          >
            {isBn ? siteConfig.tagline : siteConfig.taglineEn}
          </p>
        </Reveal>

        <SplitText
          as="h1"
          lang="en"
          text={siteConfig.name}
          delay={0.15}
          className="mt-8 font-serif text-[clamp(2.5rem,8vw,7.5rem)] leading-[1.08] text-content tracking-[-0.055em] max-w-full text-balance"
        />

        <Reveal delay={0.35}>
          <p
            className="mt-8 max-w-xl text-base sm:text-lg text-content-soft leading-[1.9] font-bengali"
            lang={locale}
          >
            {isBn ? "বাংলা সাহিত্য, মনন ও ইতিহাসের এক নিরিবিলি পাঠঘর। একটু থামুন, নতুন ভাবনায় ডুব দিন।" : "A quiet home for Bengali literature, thoughtful essays, and stories worth spending time with."}
          </p>
        </Reveal>

        <Reveal delay={0.65}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-4">
            {resumeHref && lastRead && (
              <Magnetic>
                <Link
                  href={resumeHref}
                  className={`inline-flex items-center gap-2.5 rounded-full bg-accent px-7 py-3.5 text-sm font-medium text-white transition hover:opacity-90 ${face}`}
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
                className={`inline-flex items-center justify-center rounded-full bg-accent px-7 py-3.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${face}`}
                lang={locale}
              >
                {t("home.latestSeries")}
              </Link>
            </Magnetic>

            <Magnetic>
              <Link
                href="/archive"
                className={`group inline-flex items-center gap-1.5 rounded-full border border-rule px-7 py-3.5 text-sm text-content-soft transition-colors hover:border-rule hover:text-content focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent ${face}`}
                lang={locale}
              >
                <span>{t("home.exploreArchive")}</span>
                <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </Link>
            </Magnetic>
          </div>
        </Reveal>
      </div>
          <a href="#home-collection" className="absolute bottom-6 inline-flex items-center gap-3 text-xs text-content-faint transition-colors hover:text-accent" aria-label={isBn ? "লেখাগুলি দেখুন" : "Explore the collection"}>
        <span className="h-8 w-px bg-gold/50" aria-hidden="true" />
        {isBn ? "আরও পড়ুন" : "Explore the collection"}
      </a>
    </section>
  );
}
