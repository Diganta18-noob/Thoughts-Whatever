"use client";

import { useLanguage } from "@/components/providers/language-provider";

/**
 * A heading over one run of filter chips.
 *
 * In English it prints both words — the Latin label leads, the Bengali sits
 * beside it as a gloss. In Bengali the gloss is the only word needed, so it
 * takes over the label slot instead of being duplicated.
 *
 * Both strings are passed in rather than looked up: the Bengali ones already
 * live in the tag taxonomy, and copying them into a dictionary would mean two
 * places to keep in step.
 */
export function FilterGroup({
  labelEn,
  labelBn,
  children,
}: {
  labelEn: string;
  labelBn: string;
  children: React.ReactNode;
}) {
  const { isBn } = useLanguage();

  return (
    <section className="mb-7">
      <div className="mb-2.5 flex items-baseline gap-2">
        {isBn ? (
          <span className="label font-bengali-sans tracking-normal" lang="bn">
            {labelBn}
          </span>
        ) : (
          <>
            <span className="label" lang="en">
              {labelEn}
            </span>
            <span className="font-bengali text-xs text-content-faint" lang="bn">
              {labelBn}
            </span>
          </>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </section>
  );
}
