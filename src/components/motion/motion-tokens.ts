/**
 * Shared motion vocabulary.
 *
 * Every duration and curve on the site comes from here. The brief asks for
 * motion that "feels expensive" — and what reads as expensive is almost never
 * a novel curve, it is *consistency*: the same handful of timings used
 * everywhere, so the page moves like one object rather than a dozen widgets
 * each animating to its own taste.
 */

/** Seconds — Framer Motion's unit. */
export const duration = {
  /** Pointer feedback: hover, focus, small state flips. */
  quick: 0.22,
  /** Default for UI that moves on its own. */
  base: 0.45,
  /** Section entrances. */
  slow: 0.75,
  /** The hero, the quote — the two moments allowed to take their time. */
  grand: 1.1,
} as const;

/**
 * Cubic-bezier control points.
 */
export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
  entrance: [0.16, 1, 0.3, 1],
  comet: [0.25, 0.46, 0.45, 0.94],
} as const;

/**
 * How far things travel on entry.
 */
export const distance = {
  rise: 12,
  riseLarge: 24,
} as const;

/** Per-item delay in a staggered group. */
export const stagger = {
  letter: 0.022,
  item: 0.07,
} as const;

/**
 * Viewport trigger shared by scroll reveals.
 */
export const viewport = { once: true, margin: "0px 0px -12% 0px" } as const;

/**
 * Comet-style hover zoom & card lift values.
 */
export const hover = {
  scale: 1.08,
  cardRise: -6,
  duration: 0.5,
  ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
} as const;
