"use client";

import Image from "next/image";
import Link from "next/link";
import { useProgress } from "@/components/providers/progress-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { Reveal } from "@/components/motion/reveal";
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
    <section className="relative overflow-hidden pt-8 pb-14 sm:py-16 lg:py-20">
      {/* Subtle radial glow in background */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-[600px] w-[900px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgb(var(--accent)/0.08),transparent_70%)]"
      />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
          {/* Left Column — Text & Editorial CTAs */}
          <div className="flex flex-col items-start text-left z-10">
            <Reveal>
              <p
                className="text-[0.75rem] uppercase tracking-[0.2em] text-accent font-mono font-medium mb-4"
                lang={locale}
              >
                {isBn ? "থটস হোয়াটএভার" : "THOUGHTS WHATEVER"}
              </p>
            </Reveal>

            <Reveal delay={0.1}>
              <h1
                className="font-serif text-4xl sm:text-5xl lg:text-[3.65rem] font-normal leading-[1.08] tracking-tight text-content"
                lang="en"
              >
                Bengali literature,<br />
                close reading,<br />
                and documentary.
              </h1>
            </Reveal>

            <Reveal delay={0.2}>
              <p
                className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-content-soft font-sans"
                lang={locale}
              >
                {isBn
                  ? "বাংলা সাহিত্য ও সংস্কৃতি নিয়ে পূর্ণাঙ্গ প্রবন্ধ, গবেষণা ও তথ্যচিত্র—গভীর অভিনিবেশে লেখা ও শান্তভাবে নির্মিত।"
                  : "Essays, research, and films on Bengali literature and culture—thoughtfully written, deeply read, and quietly made."}
              </p>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  href="/documentary"
                  className="inline-flex items-center justify-center rounded-sm bg-accent px-5 py-2.5 sm:px-6 sm:py-3 text-sm font-medium text-white shadow-sm transition hover:bg-accent/90 hover:shadow"
                  lang={locale}
                >
                  {isBn ? "ডকুমেন্টারি দেখুন" : "Explore Documentary"}
                </Link>

                <Link
                  href="/writing"
                  className="inline-flex items-center justify-center gap-1.5 rounded-sm border border-rule/80 bg-surface px-5 py-2.5 sm:px-6 sm:py-3 text-sm font-medium text-content transition hover:border-accent/50 hover:text-accent"
                  lang={locale}
                >
                  <span>{isBn ? "প্রবন্ধ পড়ুন" : "Read Writing"}</span>
                  <span aria-hidden>→</span>
                </Link>

                {resumeHref && lastRead && (
                  <Link
                    href={resumeHref}
                    className="inline-flex items-center gap-2 rounded-sm border border-accent/30 bg-accent/5 px-4 py-2.5 text-xs text-content-soft transition hover:border-accent hover:text-content"
                    lang={locale}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                    <span>{t("home.continueReading")}:</span>
                    <span className="font-bengali font-medium text-accent" lang="bn">
                      {lastRead.titleBn}
                    </span>
                  </Link>
                )}
              </div>
            </Reveal>
          </div>

          {/* Right Column — Cinematic Artwork Image */}
          <div className="relative flex items-center justify-center lg:justify-end">
            <Reveal delay={0.25} className="w-full max-w-lg lg:max-w-none">
              <div className="group relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden rounded-md border border-rule/50 bg-surface-raised shadow-2xl">
                <Image
                  src="/brand/hero-scholars.jpg"
                  alt="Two scholars studying manuscripts under warm candlelight"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]"
                />
                {/* Vignette Overlay for dark atmosphere integration */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface via-transparent to-black/30 opacity-60"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
