import type { Metadata } from "next";
import Link from "next/link";
import { T } from "@/components/i18n/t";
import { UnsubscribeClient } from "./unsubscribe-client";

export const metadata: Metadata = {
  title: "চিঠি বন্ধ করা",
  robots: { index: false, follow: false },
};

export default function UnsubscribePage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = searchParams.token?.trim() ?? "";

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-measure">
        <T
          k="letter.unsubEyebrow"
          className="label"
          bnClassName="font-bengali-sans tracking-normal"
        />
        <T
          as="h1"
          k="letter.unsubTitle"
          className="mt-4 text-[1.75rem] font-medium leading-tight text-content sm:text-[2.25rem]"
          bnClassName="font-bengali"
        />

        <div className="mt-8">
          {token ? (
            <UnsubscribeClient token={token} />
          ) : (
            <div>
              <T
                as="p"
                k="letter.unsubNoToken"
                className="text-bengali-base text-content-soft"
                bnClassName="font-bengali"
              />
              <Link
                href="/"
                className="mt-6 inline-block border-b border-accent text-[0.9375rem] text-accent transition hover:opacity-75"
              >
                <T
                  k="error.home"
                  className="font-serif"
                  bnClassName="font-bengali"
                />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
