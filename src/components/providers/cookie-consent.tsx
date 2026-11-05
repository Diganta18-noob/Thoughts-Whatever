"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readConsent, saveConsent } from "@/lib/analytics-consent";

export const OPEN_COOKIE_SETTINGS = "tw:open-cookie-settings";

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(readConsent() === null);
    const show = () => setOpen(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS, show);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS, show);
  }, []);
  if (!open) return null;
  const choose = (value: "accepted" | "rejected") => { saveConsent(value); setOpen(false); };
  return (
    <section aria-label="Cookie preferences" lang="en" className="fixed inset-x-3 bottom-3 z-[100000] mx-auto max-w-2xl rounded-lg border border-rule bg-surface-raised p-5 text-content shadow-lg sm:inset-x-6">
      <h2 className="font-serif text-lg">Your privacy choices</h2>
      <p className="mt-2 text-sm leading-relaxed text-content-soft">Essential storage keeps your preferences and reading tools working. Optional analytics helps us understand readership. It stays off unless you accept. <Link href="/privacy" className="underline">Privacy policy</Link></p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={() => choose("rejected")} className="min-h-11 rounded border border-rule px-4 text-sm font-medium">Reject optional analytics</button>
        <button type="button" onClick={() => choose("accepted")} className="min-h-11 rounded border border-rule px-4 text-sm font-medium">Accept analytics</button>
      </div>
      <p className="mt-3 text-xs text-content-soft">Change this anytime using Cookie settings in the footer.</p>
    </section>
  );
}
