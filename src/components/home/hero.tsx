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
    <section className="relative flex min-h-[68svh] flex-col items-center justify-center overflow-hidden px-4 pt-16 pb-10 sm:px-6">
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
            className={`text-xs uppercase tracking-[0.2em] text-content-faint ${isBn ? "font-bengali-sans normal-case tracking-normal" : "font-mono"}`}
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
          className="mt-6 font-display text-step-7 leading-[1.05] tracking-tight text-content max-w-full"
        />

        <Reveal delay={0.4}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-4">
            {resumeHref && lastRead && (
              <Magnetic>
                <Link
                  href={resumeHref}
                  className={`inline-flex items-center gap-2.5 rounded-sm bg-accent px-6 py-3 text-sm text-surface transition hover:opacity-90 ${face}`}
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
                className={`inline-flex items-center rounded-sm border border-rule px-6 py-3 text-sm text-content transition hover:border-accent/40 hover:text-accent ${face}`}
                lang={locale}
              >
                {t("home.latestSeries")}
              </Link>
            </Magnetic>

            <Magnetic>
              <Link
                href="/archive"
                className={`inline-flex items-center rounded-sm px-6 py-3 text-sm text-content-soft transition hover:text-content ${face}`}
                lang={locale}
              >
                {t("home.exploreArchive")}
              </Link>
            </Magnetic>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
