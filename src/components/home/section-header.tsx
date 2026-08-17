"use client";

import { Reveal } from "@/components/motion/reveal";
import { useLanguage } from "@/components/providers/language-provider";

/**
 * The one place a home section header is defined.
 *
 * `rank` is the hierarchy signal: anchor sections get a larger step and gold rule,
 * regular sections get a medium step, and utility sections get a compact step.
 */
export function SectionHeader({
  titleBn,
  gloss,
  rank = "section",
}: {
  titleBn: string;
  gloss?: string;
  rank?: "anchor" | "section" | "utility";
}) {
  const { isBn } = useLanguage();

  const size =
    rank === "anchor" ? "text-step-6" : rank === "section" ? "text-step-5" : "text-step-4";
  const rule =
    rank === "anchor"
      ? "after:w-16 after:bg-gold"
      : rank === "section"
        ? "after:w-10 after:bg-rule"
        : "after:w-6 after:bg-rule";

  return (
    <Reveal>
      <div
        className={`mb-[clamp(1.5rem,3vw,3rem)] after:mt-4 after:block after:h-px after:content-[''] ${rule}`}
      >
        <h2 className={`font-display font-medium text-content ${size}`} lang="bn">
          {titleBn}
        </h2>
        {!isBn && gloss && (
          <p className="mt-2 font-serif text-step-1 italic text-content-faint" lang="en">
            {gloss}
          </p>
        )}
      </div>
    </Reveal>
  );
}
