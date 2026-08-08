"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[CRITICAL GLOBAL ERROR]:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#11100F] px-4 font-sans text-[#F2EEE7]">
        <div className="w-full max-w-md text-center">
          <span className="font-mono text-xs uppercase tracking-widest text-[#B89A60]">
            500 · CRITICAL SYSTEM ERROR
          </span>

          <h1 className="mt-4 font-serif text-2xl font-medium leading-tight text-[#F2EEE7]">
            Something went wrong
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-[#A8A098]">
            An unexpected error occurred while loading the application. Please try reloading the page.
          </p>

          <div className="mt-8 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="rounded-sm bg-[#B89A60] px-5 py-2.5 text-xs font-medium text-[#11100F] transition hover:opacity-90"
            >
              Try Again
            </button>
            <a
              href="/"
              className="rounded-sm border border-[#A8A098]/30 px-5 py-2.5 text-xs font-medium text-[#A8A098] transition hover:text-[#F2EEE7]"
            >
              Return Home
            </a>
          </div>

          {error.digest && (
            <p className="mt-6 font-mono text-[0.65rem] text-[#A8A098]/60">
              Ref ID: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
