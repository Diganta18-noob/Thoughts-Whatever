"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, ArrowLeft, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  code?: string;
  referenceId?: string;
  retryable?: boolean;
  onRetry?: () => void;
  actionLabel?: string;
  actionHref?: string;
  compact?: boolean;
  className?: string;
}

/**
 * Editorial Error State Component for Thoughts.Whatever
 *
 * Adheres strictly to the site's dark cinematic visual language, subtle
 * borders, serif/bengali typography, and understated accent highlights.
 */
export function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this content right now. Please try again.",
  code,
  referenceId,
  retryable = true,
  onRetry,
  actionLabel,
  actionHref,
  compact = false,
  className,
}: ErrorStateProps) {
  if (compact) {
    return (
      <div
        role="alert"
        className={cn(
          "flex items-center justify-between gap-3 rounded-md border border-rule/50 bg-[#0d0e10] p-4 text-xs font-sans text-content-soft",
          className
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <AlertCircle className="h-4 w-4 shrink-0 text-accent/80" />
          <div className="truncate">
            <span className="font-medium text-content">{title}: </span>
            <span>{message}</span>
          </div>
        </div>

        {retryable && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-rule/80 px-2.5 py-1 text-[0.6875rem] uppercase tracking-wider text-content hover:border-accent hover:text-accent transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Retry</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={cn(
        "relative mx-auto my-8 flex max-w-lg flex-col items-center justify-center rounded-xl border border-rule/60 bg-[#0d0e10] p-8 text-center shadow-xl sm:p-10",
        className
      )}
    >
      {/* Decorative Minimal Icon */}
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-rule/60 bg-white/[0.03] text-accent">
        <AlertCircle className="h-5 w-5" />
      </div>

      {/* Title */}
      <h3 className="font-serif text-xl font-medium tracking-tight text-content sm:text-2xl">
        {title}
      </h3>

      {/* Normalized, Safe Error Message */}
      <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-content-soft">
        {message}
      </p>

      {/* Clean Technical Metadata (Ref ID / Code only — ZERO internal secrets) */}
      {(code || referenceId) && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-[0.6875rem] font-mono text-content-faint">
          {code && <span className="uppercase tracking-widest">{code}</span>}
          {code && referenceId && <span>•</span>}
          {referenceId && <span>Ref ID: {referenceId}</span>}
        </div>
      )}

      {/* Interactive Actions */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
        {retryable && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-sm bg-accent px-4 py-2 text-xs font-medium text-surface transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </button>
        )}

        {actionHref ? (
          <Link
            href={actionHref}
            className="inline-flex items-center gap-1.5 rounded-sm border border-rule px-4 py-2 text-xs font-medium text-content-soft transition hover:border-accent/60 hover:text-content"
          >
            {actionLabel?.toLowerCase().includes("home") && <Home className="h-3.5 w-3.5" />}
            {actionLabel?.toLowerCase().includes("back") && <ArrowLeft className="h-3.5 w-3.5" />}
            <span>{actionLabel || "Go Back"}</span>
          </Link>
        ) : (
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-sm border border-rule px-4 py-2 text-xs font-medium text-content-soft transition hover:border-accent/60 hover:text-content"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Return Home</span>
          </Link>
        )}
      </div>
    </div>
  );
}
