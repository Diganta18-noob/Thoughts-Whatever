"use client";

import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * A metric that counts up to its value on mount.
 *
 * Takes a `format` callback rather than formatting internally because this
 * portal renders Bengali numerals whenever the interface is in Bangla — the
 * caller already knows which script it wants, and every intermediate frame has
 * to go through the same conversion as the final one.
 *
 * Duration scales with magnitude, logarithmically: 12 and 12,480 want the same
 * *perceived* speed, and a fixed duration makes the larger number look like it
 * is struggling while the smaller one barely moves.
 */
export function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number;
  format: (value: number) => string;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (reduced) {
      setDisplay(value);
      return;
    }

    const controls = animate(0, value, {
      duration: Math.min(0.9, 0.35 + Math.log10(Math.max(Math.abs(value), 1)) * 0.18),
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });

    return () => controls.stop();
  }, [value, reduced]);

  // `tabular-nums` stops the tile reflowing on every frame as digit widths
  // change mid-count — most noticeable on a 1 following a 9.
  return <span className={cn("tabular-nums", className)}>{format(display)}</span>;
}
