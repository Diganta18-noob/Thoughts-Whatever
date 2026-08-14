"use client";

import { motion, useInView, useAnimation, useReducedMotion } from "framer-motion";
import { useEffect, useRef, type ReactNode } from "react";
import { duration, distance, ease, stagger, viewport } from "./motion-tokens";
import { debug } from "@/lib/debug";

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
  const ref = useRef<HTMLElement>(null);
  const controls = useAnimation();
  const isInView = useInView(ref, { once: true, margin: viewport.margin });
  const Tag = (motion as any)[as] || motion.div;

  useEffect(() => {
    if (reduced) return;
    if (isInView) {
      controls.start({
        opacity: 1,
        y: 0,
        transition: { duration: duration.slow, ease: ease.entrance, delay },
      });
    }
  }, [isInView, controls, reduced, delay]);

  // Safety net: if element is in viewport on mount but Framer
  // missed the initial observation, force-reveal after 300ms
  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;

    const timer = setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const isVisible =
        rect.top < window.innerHeight &&
        rect.bottom > 0 &&
        rect.left < window.innerWidth &&
        rect.right > 0;

      if (isVisible) {
        debug.log("REVEAL", "Missed IntersectionObserver — forcing reveal", {
          element: el.getAttribute("data-reveal-id") ?? el.tagName.toLowerCase(),
        });
        controls.start({
          opacity: 1,
          y: 0,
          transition: { duration: duration.base, ease: ease.entrance },
        });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [controls, reduced]);

  if (reduced) return <Tag className={className}>{children}</Tag>;

  return (
    <Tag
      ref={ref}
      data-reveal
      className={className}
      initial={{ opacity: 0, y: y === "lg" ? distance.riseLarge : distance.rise }}
      animate={controls}
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
