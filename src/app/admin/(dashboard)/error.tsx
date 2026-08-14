"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function AdminDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin dashboard runtime error:", error);
  }, [error]);

  return (
    <div className="rounded-lg border border-rule bg-surface p-10 text-center space-y-4 max-w-lg mx-auto my-12">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h2 className="font-serif text-lg font-medium text-content">Something went wrong</h2>
        <p className="font-sans text-xs text-content-soft">
          We encountered an issue loading this administrative view.
        </p>
      </div>
      {error?.message && (
        <p className="rounded bg-content/5 p-2 font-mono text-[0.6875rem] text-content-faint break-all text-left">
          {error.message}
        </p>
      )}
      <button
        onClick={reset}
        className="inline-flex items-center gap-1.5 rounded bg-accent px-4 py-2 font-sans text-xs font-medium text-surface shadow transition hover:opacity-90"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span>Try again</span>
      </button>
    </div>
  );
}
