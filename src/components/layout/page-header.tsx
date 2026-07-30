import React from "react";

export function PageHeader({
  labelEn,
  titleBn,
  descBn,
  count,
}: {
  labelEn: string;
  titleBn: string;
  descBn?: string;
  count?: React.ReactNode;
}) {
  return (
    <header className="border-b border-rule pb-8 mb-10 pt-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="label font-mono uppercase tracking-widest text-accent">{labelEn}</span>
        {count && <span className="label font-mono text-content-faint">{count}</span>}
      </div>
      <h1 className="mt-2 font-bengali text-3xl sm:text-4xl font-semibold text-content leading-tight">
        {titleBn}
      </h1>
      {descBn && (
        <p className="mt-3 font-bengali text-bengali-base text-content-soft max-w-2xl leading-relaxed">
          {descBn}
        </p>
      )}
    </header>
  );
}
