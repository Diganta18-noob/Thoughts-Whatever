"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { duration, distance, ease, stagger, viewport } from "./motion-tokens";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Seconds to hold before starting. Use sparingly — see `Stagger`. */
  delay?: number;
  /** Travel distance; `lg` for a whole section, default for text. */
  y?: "sm" | "lg";
  as?: "div" | "section" | "article" | "li" | "span" | "figure";
};

export function Reveal({
  children,
  className,
  delay = 0,
  y = "sm",
  as = "div",
}: RevealProps) {
  const reduced = useReducedMotion();
  const Tag = motion[as];

  if (reduced) return <Tag className={className}>{children}</Tag>;

  return (
    <Tag
      data-reveal
      className={className}
      initial={{ opacity: 0, y: y === "lg" ? distance.riseLarge : distance.rise }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport}
      transition={{ duration: duration.slow, ease: ease.entrance, delay }}
    >
      {children}
    </Tag>
  );
}

/**
 * A group whose children reveal one after another.
 */
export function Stagger({
  children,
  className,
  delay = 0,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "ul" | "ol";
}) {
  const reduced = useReducedMotion();
  const Tag = motion[as];

  if (reduced) return <Tag className={className}>{children}</Tag>;

  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={viewport}
      variants={{
        hidden: {},
        shown: { transition: { staggerChildren: stagger.item, delayChildren: delay } },
      }}
    >
      {children}
    </Tag>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "li" | "figure";
}) {
  const reduced = useReducedMotion();
  const Tag = motion[as];

  if (reduced) return <Tag className={className}>{children}</Tag>;

  return (
    <Tag
      className={className}
      variants={{
        hidden: { opacity: 0, y: distance.rise },
        shown: {
          opacity: 1,
          y: 0,
          transition: { duration: duration.base, ease: ease.entrance },
        },
      }}
      data-reveal
    >
      {children}
    </Tag>
  );
}
