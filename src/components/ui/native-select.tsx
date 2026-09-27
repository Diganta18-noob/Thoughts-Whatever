"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A native `<select>` wearing the Input shell.
 *
 * The Radix `Select` in ./select.tsx is the right control when a dropdown
 * needs search, grouping or custom item rendering — but its API is a composed
 * set of parts, so adopting it means rewriting every call site's `<option>`s
 * by hand. The admin has ~30 plain selects whose only real problem is that
 * they were styled one at a time: several set `text-content-faint`, dimming
 * the chosen value, and several focus green while everything else focuses
 * accent. For those, a native element fixes everything as a rename.
 *
 * Renders a single element with no wrapper, deliberately: several of these
 * selects sit in flex rows, where a wrapping div would collapse to content
 * width and quietly break the layout. That rules out an absolutely-positioned
 * chevron, so the chevron is a background image instead.
 */

/**
 * `appearance-none` removes the native arrow, which cannot be styled. The
 * replacement stroke is fixed rather than `currentColor` — a data URI has no
 * access to the cascade — and is set to a mid grey that reads correctly
 * against all four themes, matching `content-faint` closely on each.
 */
const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none' stroke='%23888888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2.5 4.5 6 8l3.5-3.5'/%3E%3C/svg%3E\")";

export const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function NativeSelect({ className, style, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "h-9 w-full appearance-none rounded-card border border-rule bg-surface-raised pl-3 pr-8 font-ui text-step-0 text-content",
        "bg-[position:right_0.625rem_center] bg-[length:0.75rem] bg-no-repeat",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      style={{ backgroundImage: CHEVRON, ...style }}
      {...props}
    >
      {children}
    </select>
  );
});
