"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Search, Sun, BookOpen, Moon, Menu, X, ShieldCheck } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const isActive = (path: string) => pathname === path || (path !== "/" && pathname.startsWith(path));

  return (
    <header
      data-print="hide"
      className="sticky top-0 z-40 border-b border-rule bg-surface/90 backdrop-blur-md transition-colors"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Wordmark */}
        <Link href="/" className="group shrink-0">
          <span className="block font-display text-[1.4rem] leading-none text-content transition-colors group-hover:text-accent">
            কথা ও কাহিনী
          </span>
          <span className="label mt-1 hidden sm:block">
            বাংলা সাহিত্য ও তথ্যচিত্র আর্কাইভ
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-bengali">
          <Link
            href="/"
            className={`px-3 py-2 rounded-xs transition-colors relative ${
              isActive("/") && !pathname.includes("/category") && !pathname.includes("/series")
                ? "text-accent font-semibold"
                : "text-content-soft hover:text-content"
            }`}
          >
            প্রচ্ছদ
          </Link>
          <Link
            href="/category/history-heritage"
            className={`px-3 py-2 rounded-xs transition-colors relative ${
              pathname.includes("history-heritage") ? "text-accent font-semibold" : "text-content-soft hover:text-content"
            }`}
          >
            ইতিহাস ও ঐতিহ্য
          </Link>
          <Link
            href="/category/literature-philosophy"
            className={`px-3 py-2 rounded-xs transition-colors relative ${
              pathname.includes("literature-philosophy") ? "text-accent font-semibold" : "text-content-soft hover:text-content"
            }`}
          >
            সাহিত্য ও দর্শন
          </Link>
          <Link
            href="/#series"
            className="px-3 py-2 rounded-xs transition-colors text-content-soft hover:text-content"
          >
            সিরিজসমূহ
          </Link>
        </nav>

        {/* Right Chrome Controls */}
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="p-2 rounded-full text-content-soft hover:text-content hover:bg-content/5 transition-colors"
            title="অনুসন্ধান"
          >
            <Search className="w-4 h-4" />
          </Link>

          {/* Reading Theme Selector */}
          <div className="flex items-center gap-0.5 bg-surface-raised p-1 rounded-full border border-rule">
            <button
              onClick={() => setTheme("cream")}
              className={`p-1.5 rounded-full text-xs transition-all ${
                theme === "cream" ? "bg-journal-vermilion text-white font-bold" : "text-content-faint hover:text-content"
              }`}
              title="ক্রিম পেপার"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme("sepia")}
              className={`p-1.5 rounded-full text-xs transition-all ${
                theme === "sepia" ? "bg-journal-vermilion text-white font-bold" : "text-content-faint hover:text-content"
              }`}
              title="সেপিয়া"
            >
              <BookOpen className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme("night")}
              className={`p-1.5 rounded-full text-xs transition-all ${
                theme === "night" ? "bg-archive-ember text-white font-bold" : "text-content-faint hover:text-content"
              }`}
              title="নাইট মোড"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          <Link
            href="/admin/dashboard"
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-mono label border border-rule hover:border-accent text-accent transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            ADMIN
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full text-content-soft hover:text-content"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-rule bg-surface-raised p-4 space-y-3 font-bengali text-sm">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-content font-medium"
          >
            প্রচ্ছদ
          </Link>
          <Link
            href="/category/history-heritage"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-content-soft"
          >
            ইতিহাস ও ঐতিহ্য
          </Link>
          <Link
            href="/category/literature-philosophy"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-content-soft"
          >
            সাহিত্য ও দর্শন
          </Link>
          <Link
            href="/#series"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-content-soft"
          >
            সিরিজসমূহ
          </Link>
          <Link
            href="/search"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-content-soft"
          >
            অনুসন্ধান করুন
          </Link>
          <Link
            href="/admin/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-accent font-mono text-xs uppercase"
          >
            Admin Dashboard
          </Link>
        </div>
      )}
    </header>
  );
}
