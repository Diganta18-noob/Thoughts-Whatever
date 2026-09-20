"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { normalizeError } from "@/lib/errors";

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

  const safeError = normalizeError(error, "We encountered an issue loading this administrative view. Please try again.");

  return (
    <div className="rounded-lg border border-rule bg-surface p-10 text-center space-y-4 max-w-lg mx-auto my-12">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div className="space-y-1">
        <h2 className="font-serif text-lg font-medium text-content">{safeError.title}</h2>
        <p className="font-sans text-xs text-content-soft">
          {safeError.message}
        </p>
      </div>
      {safeError.referenceId && (
        <p className="font-mono text-[0.6875rem] text-content-faint">
          Ref ID: {safeError.referenceId}
        </p>
      )}
      <div>
        <button
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded bg-accent px-4 py-2 font-sans text-xs font-medium text-surface shadow transition hover:opacity-90"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Try again</span>
        </button>
      </div>
    </div>
  );
}
