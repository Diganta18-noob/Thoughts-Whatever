import type { Metadata } from "next";
import {
  Noto_Serif_Bengali,
  Hind_Siliguri,
  Galada,
  Fraunces,
  Inter,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { NewsletterModal } from "@/components/features/newsletter/newsletter-modal";

const bengaliSerif = Noto_Serif_Bengali({
  subsets: ["bengali"],
  display: "swap",
  variable: "--font-bengali-serif",
  fallback: ["SolaimanLipi", "Kalpurush", "Vrinda", "serif"],
});

const bengaliSans = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-bengali-sans",
  fallback: ["SolaimanLipi", "Kalpurush", "sans-serif"],
});

const bengaliDisplay = Galada({
  subsets: ["bengali", "latin"],
  weight: "400",
  display: "swap",
  variable: "--font-bengali-display",
});

const latinSerif = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-latin-serif",
});

const latinSans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-latin-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "কথা ও কাহিনী — বাংলা সাহিত্য ও তথ্যচিত্র আর্কাইভ",
  description: "ইনস্টাগ্রাম রিলসের বিস্তৃত গল্প, প্রামাণ্য ইতিহাস, দর্শন ও সাহিত্য চর্চার প্রিমিয়াম ডিজিটাল প্ল্যাটফর্ম।",
  keywords: ["বাংলা সাহিত্য", "তথ্যচিত্র", "ইতিহাস", "রবীন্দ্রনাথ", "ইনস্টাগ্রাম রিল"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bn"
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
      <body className="min-h-screen flex flex-col antialiased bg-surface text-content transition-colors">
        <ThemeProvider>
          <Header />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
          <NewsletterModal />
        </ThemeProvider>
      </body>
    </html>
  );
}
