"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Motion primitives for the admin portal.
 *
 * Deliberately small and deliberately fast. An editing tool is somewhere people
 * work all day, so entrances are quick (under 300ms) and travel a few pixels —
 * anything slower or larger reads as latency the second time you see it, and
 * you see these dozens of times a session. Nothing here animates on scroll.
 *
 * Every primitive drops to a plain element under `prefers-reduced-motion`,
 * rather than animating to a shorter duration: the point is no movement at all.
 */

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

type MotionBoxProps = {
  children: React.ReactNode;
  className?: string;
};

export function FadeIn({
  children,
  className,
  delay = 0,
}: MotionBoxProps & { delay?: number }) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Parent for a row or grid of `StaggerItem`s. The offset is small on purpose —
 * a long cascade across eight stat tiles makes a dashboard feel slow to load
 * even when the data was already there.
 */
export function Stagger({
  children,
  className,
  gap = 0.045,
}: MotionBoxProps & { gap?: number }) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: MotionBoxProps) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  );
}
