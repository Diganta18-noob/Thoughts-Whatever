"use client";

import { Printer } from "lucide-react";

/**
 * Bengali readers save and circulate essays as PDFs constantly — over
 * WhatsApp, in reading groups, to people with slow connections. The browser's
 * own print-to-PDF is better than anything worth building: it respects the
 * reader's chosen text size and needs no server round trip. The print
 * stylesheet in globals.css does the actual work.
 */
export function PrintButton() {
  return (
    <button
      type="button"
      data-print="hide"
      onClick={() => window.print()}
      title="ছাপুন বা PDF করুন"
      className="inline-flex items-center gap-1.5 rounded-sm border border-rule px-2.5 py-1.5 text-xs text-content-soft transition hover:border-content-faint hover:text-content"
    >
      <Printer className="h-3.5 w-3.5" />
      <span className="font-bengali-sans">PDF</span>
    </button>
  );
}
