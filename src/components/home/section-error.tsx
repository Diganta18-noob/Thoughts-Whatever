"use client";

import { useLanguage } from "@/components/providers/language-provider";

export function SectionError({ message }: { message?: string }) {
  const { isBn } = useLanguage();

  return (
    <div className="my-8 rounded-sm border border-rule/60 bg-surface-raised/40 p-6 text-center">
      <p className={`text-sm text-content-soft ${isBn ? "font-bengali" : "font-sans"}`}>
        {message ?? (isBn ? "এই অংশটি লোড করা সম্ভব হয়নি।" : "Unable to load this section.")}
      </p>
    </div>
  );
}
