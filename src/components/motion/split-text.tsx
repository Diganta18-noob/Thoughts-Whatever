"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Fragment, useMemo } from "react";
import { duration, ease, stagger, viewport } from "./motion-tokens";

/** Grapheme clusters, or null if the platform cannot tell us where they are. */
function graphemes(text: string): string[] | null {
  if (typeof Intl === "undefined" || !("Segmenter" in Intl)) return null;
  const segmenter = new Intl.Segmenter("bn", { granularity: "grapheme" });
  return [...segmenter.segment(text)].map((s) => s.segment);
}

type SplitTextProps = {
  text: string;
  className?: string;
  /** Seconds before the first grapheme moves. */
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  lang?: string;
};

export function SplitText({
  text,
  className,
  delay = 0,
  as: Tag = "span",
  lang,
}: SplitTextProps) {
  const reduced = useReducedMotion();

  const words = useMemo(() => {
    const clusters = graphemes(text);
    if (!clusters) return null;

    const out: string[][] = [[]];
    for (const cluster of clusters) {
      if (/^\s+$/.test(cluster)) {
        if (out[out.length - 1]!.length) out.push([]);
      } else {
        out[out.length - 1]!.push(cluster);
      }
    }
    return out.filter((word) => word.length > 0);
  }, [text]);

  if (reduced || !words) {
    return (
      <Tag className={className} lang={lang}>
        {text}
      </Tag>
    );
  }

  let index = -1;

  return (
    <Tag className={className} lang={lang}>
      <span className="sr-only">{text}</span>
      <motion.span
        aria-hidden
        data-reveal
        initial="hidden"
        whileInView="shown"
        viewport={viewport}
        variants={{
          hidden: {},
          shown: {
            transition: { staggerChildren: stagger.letter, delayChildren: delay },
          },
        }}
      >
        {words.map((word, w) => (
          <Fragment key={w}>
            <span className="inline-block whitespace-nowrap">
              {word.map((cluster) => {
                index += 1;
                return (
                  <motion.span
                    key={index}
                    className="inline-block"
                    variants={{
                      hidden: { opacity: 0, y: "0.32em" },
                      shown: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: duration.slow, ease: ease.out },
                      },
                    }}
                  >
                    {cluster}
                  </motion.span>
                );
              })}
            </span>
            {w < words.length - 1 ? " " : null}
          </Fragment>
        ))}
      </motion.span>
    </Tag>
  );
}
