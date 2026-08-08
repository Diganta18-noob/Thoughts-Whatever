import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { T } from "@/components/i18n/t";

export const metadata: Metadata = {
  title: "Access Restricted — Thoughts Whatever",
  robots: { index: false, follow: false },
};

export default function UnauthorizedPage() {
  return (
    <div className="mx-auto flex min-h-[75vh] max-w-6xl flex-col justify-center px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <span className="label font-mono text-xs uppercase tracking-widest text-accent font-semibold">
          401 · ACCESS RESTRICTED
        </span>

        <h1 className="mt-4 font-bengali text-2xl sm:text-3xl font-medium leading-tight text-content" lang="bn">
          অনুমতি প্রয়োজন
        </h1>

        <p className="mt-4 font-bengali text-base leading-relaxed text-content-soft" lang="bn">
          এই অংশটি দেখতে বা কোনো পরিবর্তন করতে প্রয়োজনীয় প্রশাসনিক অনুমতি নেই। অনুগ্রহ করে লগইন করুন বা মূল পাতায় ফিরে যান।
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/admin/login"
            className="rounded-sm bg-accent px-5 py-2.5 font-bengali text-sm font-medium text-surface transition hover:opacity-90"
          >
            লগইন করুন
          </Link>
          <Link
            href="/"
            className="rounded-sm border border-rule px-5 py-2.5 font-bengali text-sm font-medium text-content-soft transition hover:border-accent/40 hover:text-content"
          >
            মূল পাতায় ফিরুন
          </Link>
        </div>
      </div>
    </div>
  );
}
