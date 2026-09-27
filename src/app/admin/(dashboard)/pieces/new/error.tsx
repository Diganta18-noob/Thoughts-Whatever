'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { normalizeError } from '@/lib/errors';
import { Button } from "@/components/ui";

export default function NewPieceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Editor page error:', error);
  }, [error]);

  const safeError = normalizeError(error, 'Something went wrong loading the piece editor.');

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 font-serif text-sm text-content-soft transition hover:text-accent"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to dashboard
      </Link>

      <div className="rounded-sm border border-danger/20 bg-danger/5 p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-danger" />
          <div>
            <h2 className="font-serif text-lg font-semibold text-content">
              Failed to load editor
            </h2>
            <p className="mt-2 text-sm text-content-soft">
              {safeError.message}
            </p>
            <div className="mt-4 flex gap-3">
              <Button variant="primary"
                onClick={reset}
              >
                Try again
              </Button>
              <Link
                href="/admin"
                className="rounded-sm border border-rule px-4 py-2 text-sm text-content-soft transition hover:text-content"
              >
                Go to dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
