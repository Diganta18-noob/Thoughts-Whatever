"use client";

import Link from "next/link";
import { useState } from "react";
import { Send, Mail, Check } from "lucide-react";
import { InstagramIcon } from "@/components/shared/brand-icons";

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 4000);
  };

  return (
    <footer data-print="hide" className="border-t border-rule bg-surface text-content mt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 space-y-12">
        <div className="rule-ornament text-xs uppercase tracking-widest font-mono">
          কথা ও কাহিনী — সাহিত্য ও তথ্যচিত্র
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-block font-display text-2xl text-content">
              কথা ও কাহিনী
            </Link>
            <p className="text-bengali-sm text-content-soft leading-relaxed max-w-md font-bengali">
              বাংলা সাহিত্য নিয়ে পূর্ণাঙ্গ লেখা, পাঠ-পর্যালোচনা ও তথ্যচিত্র। ইনস্টাগ্রাম রিলের পিছনের সম্পূর্ণ ঐতিহাসিক ও প্রামাণ্য রচনা এখানে আর্カイভ করা থাকে।
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-full border border-rule text-content-soft hover:text-accent transition-colors"
                title="ইনস্টাগ্রাম"
              >
                <InstagramIcon className="w-4 h-4" />
              </a>
              <a
                href="mailto:contact@katha-kahini.com"
                className="p-2 rounded-full border border-rule text-content-soft hover:text-accent transition-colors"
                title="ইমেইল"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h4 className="label">বিভাগসমূহ</h4>
            <ul className="space-y-2 text-sm font-bengali text-content-soft">
              <li>
                <Link href="/category/history-heritage" className="hover:text-accent transition-colors">
                  ইতিহাস ও ঐতিহ্য
                </Link>
              </li>
              <li>
                <Link href="/category/literature-philosophy" className="hover:text-accent transition-colors">
                  সাহিত্য ও দর্শন
                </Link>
              </li>
              <li>
                <Link href="/category/culture-art" className="hover:text-accent transition-colors">
                  সংস্কৃতি ও শিল্প
                </Link>
              </li>
              <li>
                <Link href="/category/biography-personalities" className="hover:text-accent transition-colors">
                  জীবনী ও ব্যক্তিত্ব
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-3">
            <h4 className="label">নিউজলেটার</h4>
            <p className="text-xs font-bengali text-content-soft">
              নতুন তথ্যচিত্র ও সাহিত্য নিবন্ধ প্রকাশের সঙ্গে সঙ্গে সরাসরি ইমেইলে পান।
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="আপনার ইমেইল..."
                  className="w-full px-3 py-2 text-xs rounded-sm bg-surface-raised border border-rule text-content focus:outline-hidden focus:border-accent font-sans"
                  required
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 px-2.5 rounded-xs bg-accent text-white hover:opacity-90 transition-opacity flex items-center justify-center"
                >
                  {subscribed ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>
              {subscribed && (
                <p className="text-[11px] font-bengali text-accent">
                  ধন্যবাদ! আপনার সাবস্ক্রিপশন সম্পন্ন হয়েছে।
                </p>
              )}
            </form>
          </div>
        </div>

        <div className="border-t border-rule pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-content-faint font-mono">
          <p>© {new Date().getFullYear()} KATHA & KAHINI. ALL RIGHTS RESERVED.</p>
          <p className="font-bengali text-content-faint mt-2 sm:mt-0">
            বাঙালি পাঠক ও গবেষকদের জন্য ডিজিটাল সংস্করণ
          </p>
        </div>
      </div>
    </footer>
  );
}
