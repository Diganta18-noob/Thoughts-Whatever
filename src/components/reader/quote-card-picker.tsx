"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Quote, X, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

/**
 * Select a line → get a shareable card.
 *
 * The point of this feature is direction of travel. Everything else on the
 * site pulls readers off Instagram; this pushes a branded 1080×1350 card back
 * onto it, posted by the reader, in their story, with the site's name on it.
 * Almost nothing in the Bengali literary space does this.
 *
 * The card itself is rendered server-side by /api/quote-card, because Bengali
 * conjuncts cannot be laid out reliably in <canvas> — the browser's canvas
 * text API does no complex-script shaping, so ক্ষ comes out as three separate
 * glyphs. Satori with a real Bengali font does it correctly.
 */

const MAX_CHARS = 240;
const MIN_CHARS = 12;

export function QuoteCardPicker({
  containerId,
  slug,
  titleBn,
}: {
  containerId: string;
  slug: string;
  titleBn: string;
}) {
  const [selection, setSelection] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);
  const [cardText, setCardText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    containerRef.current = document.getElementById(containerId);
  }, [containerId]);

  const readSelection = useCallback(() => {
    const sel = window.getSelection();
    const container = containerRef.current;
    if (!sel || sel.isCollapsed || !container) {
      setSelection(null);
      return;
    }

    // Only react to selections inside the prose.
    const anchor = sel.anchorNode;
    if (!anchor || !container.contains(anchor)) {
      setSelection(null);
      return;
    }

    const text = sel.toString().replace(/\s+/g, " ").trim();
    if (text.length < MIN_CHARS) {
      setSelection(null);
      return;
    }

    const rect = sel.getRangeAt(0).getBoundingClientRect();
    setSelection({
      text: text.slice(0, MAX_CHARS),
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  }, []);

  useEffect(() => {
    // pointerup rather than selectionchange: the latter fires on every
    // character as a drag-select grows, which makes the button jitter.
    document.addEventListener("pointerup", readSelection);
    document.addEventListener("keyup", readSelection);
    return () => {
      document.removeEventListener("pointerup", readSelection);
      document.removeEventListener("keyup", readSelection);
    };
  }, [readSelection]);

  const cardUrl = cardText
    ? `/api/quote-card?${new URLSearchParams({ text: cardText, slug })}`
    : null;

  return (
    <>
      {/* Floating trigger, anchored to the selection */}
      {selection && !cardText && (
        <button
          type="button"
          data-print="hide"
          onClick={() => {
            setCardText(selection.text);
            setSelection(null);
          }}
          style={{
            left: Math.min(Math.max(selection.x, 90), window.innerWidth - 90),
            top: Math.max(selection.y - 46, 8),
          }}
          className="fixed z-40 -translate-x-1/2 animate-fade-up rounded-sm border border-rule bg-surface-raised px-3 py-2 text-xs shadow-lg"
        >
          <span className="flex items-center gap-1.5 font-bengali-sans text-content">
            <Quote className="h-3.5 w-3.5 text-accent" />
            কার্ড বানান
          </span>
        </button>
      )}

      {/* Card preview */}
      {cardText && cardUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="উদ্ধৃতি কার্ড"
          data-print="hide"
        >
          <button
            type="button"
            aria-label="বন্ধ করুন"
            onClick={() => setCardText(null)}
            className="absolute inset-0 cursor-default bg-black/55 backdrop-blur-[2px]"
          />

          <div className="relative flex max-h-[90vh] w-full max-w-sm flex-col overflow-hidden rounded-sm border border-rule bg-surface-raised">
            <div className="flex items-center justify-between border-b border-rule px-4 py-2.5">
              <span className="label">Quote card</span>
              <button
                type="button"
                onClick={() => setCardText(null)}
                aria-label="বন্ধ করুন"
                className="grid h-7 w-7 place-items-center rounded-full text-content-faint hover:text-content"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cardUrl}
                alt={`উদ্ধৃতি: ${cardText}`}
                width={1080}
                height={1350}
                className="w-full rounded-[2px] border border-rule"
              />
            </div>

            <div className="flex gap-2 border-t border-rule p-3">
              <a
                href={cardUrl}
                download={`${slug}-quote.png`}
                className="flex flex-1 items-center justify-center gap-2 rounded-sm bg-accent px-3 py-2.5 font-bengali-sans text-sm text-surface transition hover:opacity-90"
              >
                <Download className="h-4 w-4" />
                ছবি নামান
              </a>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(`“${cardText}”\n\n— ${titleBn}`);
                    setCopied(true);
                    toast("লেখা কপি হয়েছে");
                    setTimeout(() => setCopied(false), 2000);
                  } catch {
                    toast("কপি করা গেল না");
                  }
                }}
                aria-label="লেখা কপি করুন"
                className="grid w-11 place-items-center rounded-sm border border-rule text-content-soft transition hover:text-content"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-accent" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>

            <p className="border-t border-rule px-4 py-2.5 font-bengali-sans text-[0.6875rem] leading-relaxed text-content-faint">
              স্টোরিতে দিলে ট্যাগ করবেন — দেখতে ভালো লাগে।
            </p>
          </div>
        </div>
      )}
    </>
  );
}
