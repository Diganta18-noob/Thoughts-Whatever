"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLanguageSafe } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t, locale, isBn } = useLanguageSafe();
  const face = isBn ? "font-bengali" : "font-serif";

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-center px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-measure text-center" lang={locale}>
        <span className={cn("label", isBn && "font-bengali-sans tracking-normal")}>
          {t("error.label")}
        </span>
        <h1
          className={cn(
            "mt-4 text-[1.75rem] font-medium leading-tight text-content sm:text-[2.25rem]",
            face,
          )}
        >
          {t("error.title")}
        </h1>
        <p className={cn("mx-auto mt-4 text-bengali-base text-content-soft", face)}>
          {t("error.body")}
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={reset}
            className={cn(
              "rounded-sm bg-accent px-4 py-2 text-[0.9375rem] text-surface transition hover:opacity-90",
              face,
            )}
          >
            {t("common.retry")}
          </button>
          <Link
            href="/"
            className={cn(
              "rounded-sm border border-rule px-4 py-2 text-[0.9375rem] text-content-soft transition hover:text-content",
              face,
            )}
          >
            {t("error.home")}
          </Link>
        </div>

        {error.digest && (
          <p className="mt-8 font-mono text-[0.6875rem] text-content-faint">
            {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
