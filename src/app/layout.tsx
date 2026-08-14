import type { Metadata, Viewport } from "next";
import {
  Noto_Serif_Bengali,
  Hind_Siliguri,
  Galada,
  Fraunces,
  Inter,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";

import { ThemeScript } from "@/components/providers/theme-script";
import { AppProviders } from "@/components/providers";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { PublicChrome } from "@/components/layout/public-chrome";
import { siteConfig, absoluteUrl } from "@/lib/utils";

/* ─── Type ────────────────────────────────────────────────────
   Real weights are loaded for every face that is ever set bold.
   Nothing here relies on the browser synthesising a weight, because
   synthetic bold destroys Bengali conjuncts. See globals.css.
   ─────────────────────────────────────────────────────────── */

// Body — literary Bengali. Variable weight, excellent যুক্তাক্ষর rendering.
const bengaliSerif = Noto_Serif_Bengali({
  subsets: ["bengali"],
  display: "swap",
  variable: "--font-bengali-serif",
  fallback: ["SolaimanLipi", "Kalpurush", "Vrinda", "serif"],
});

// Bengali sans — captions, labels, UI written in Bangla.
const bengaliSans = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-bengali-sans",
  fallback: ["SolaimanLipi", "Kalpurush", "sans-serif"],
});

// Wordmark only.
const bengaliDisplay = Galada({
  subsets: ["bengali", "latin"],
  weight: "400",
  display: "optional",
  variable: "--font-bengali-display",
});

// Latin serif for the English chrome — carries the journal feel.
const latinSerif = Fraunces({
  subsets: ["latin"],
  display: "optional",
  variable: "--font-latin-serif",
  axes: ["SOFT", "WONK", "opsz"],
});

const latinSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-latin-sans",
});

// Archive labels on documentary pages.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "optional",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s — ${siteConfig.name}`,
  },
  description:
    "বাংলা সাহিত্য নিয়ে পূর্ণাঙ্গ লেখা, পাঠ-পর্যালোচনা ও তথ্যচিত্র। রিলের পিছনের সম্পূর্ণ রচনা এখানে।",
  keywords: [
    "বাংলা সাহিত্য",
    "বাংলা প্রবন্ধ",
    "রবীন্দ্রনাথ",
    "জীবনানন্দ দাশ",
    "কাজী নজরুল ইসলাম",
    "বাংলা কবিতা",
    "তথ্যচিত্র",
    "Bengali literature",
  ],
  authors: [{ name: siteConfig.nameEn, url: siteConfig.url }],
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": absoluteUrl("/rss.xml") },
  },
  icons: {
    icon: [
      { url: "/brand/logo-icon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: { url: "/brand/logo-icon.svg" },
  },
  openGraph: {
    type: "website",
    locale: "bn_IN",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: "রিলের পিছনের সম্পূর্ণ লেখা, ব্লগ ও তথ্যচিত্র।",
    images: [
      {
        url: absoluteUrl("/brand/logo-full.svg"),
        width: 1200,
        height: 630,
        alt: "Thoughts Whatever — t.w logo",
      },
    ],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FDFBF5" },
    { media: "(prefers-color-scheme: dark)", color: "#0D0D0E" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    // lang follows the *interface* locale, not the content. ThemeScript
    // overwrites this before first paint from the stored preference; `en` is
    // the SSR value because that is DEFAULT_LOCALE, and it is what a reader
    // with storage disabled ends up seeing. Bengali prose is not affected —
    // every Bengali region carries its own lang="bn" (see prose.tsx,
    // article-view.tsx, piece-card.tsx), so screen readers still switch voice.
    <html
      lang="en"
      data-theme="cream"
      suppressHydrationWarning
      className={[
        bengaliSerif.variable,
        bengaliSans.variable,
        bengaliDisplay.variable,
        latinSerif.variable,
        latinSans.variable,
        mono.variable,
      ].join(" ")}
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-sm focus:bg-accent focus:px-4 focus:py-2 focus:text-surface"
        >
          মূল লেখা বা বিষয়বস্তুতে যান (Skip to content)
        </a>
        <AppProviders>
          <PublicChrome>
            <SiteHeader />
          </PublicChrome>
          <main id="main-content" className="flex-1">{children}</main>
          <PublicChrome>
            <SiteFooter />
          </PublicChrome>
        </AppProviders>
      </body>
    </html>
  );
}
