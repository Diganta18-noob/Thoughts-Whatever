import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

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

        <h1 className="mt-4 font-serif text-2xl sm:text-3xl font-medium leading-tight text-content">
          Permission Required
        </h1>

        <p className="mt-4 font-serif text-base leading-relaxed text-content-soft">
          You do not have the administrative permissions required to view or modify this area. Please log in with an authorized account or return home.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/admin/login"
            className="rounded-sm bg-accent px-5 py-2.5 font-sans text-sm font-medium text-surface transition hover:opacity-90"
          >
            Sign In
          </Link>
          <Link
            href="/"
            className="rounded-sm border border-rule px-5 py-2.5 font-sans text-sm font-medium text-content-soft transition hover:border-accent/40 hover:text-content"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}
