/**
 * Shared motion vocabulary.
 *
 * Every duration and curve on the site comes from here. The brief asks for
 * motion that "feels expensive" — and what reads as expensive is almost never
 * a novel curve, it is *consistency*: the same handful of timings used
 * everywhere, so the page moves like one object rather than a dozen widgets
 * each animating to its own taste.
 *
 * Two rules behind the numbers:
 *
 *   Nothing overshoots. Springy easing (back-out, bounce) is the single
 *   loudest tell of a template. Everything here decelerates into place and
 *   stops.
 *
 *   Entrances are slow, responses are fast. A section revealing itself as you
 *   scroll can take three quarters of a second and feel considered; a button
 *   taking that long to acknowledge a hover feels broken. Hence `quick` for
 *   anything answering a pointer, `slow`/`grand` for anything answering the
 *   scroll position.
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
 *
 * `out` is the workhorse: a long, flat tail that arrives without a bump.
 * `inOut` is for things that both leave and enter (a header condensing).
 * `entrance` is slightly steeper at the start so a reveal has some attack
 * before it settles, which stops slow fades from reading as sluggish.
 */
export const ease = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
  entrance: [0.16, 1, 0.3, 1],
} as const;

/**
 * How far things travel on entry.
 *
 * Small on purpose. A 12px rise reads as the text settling onto the page; a
 * 60px rise reads as the text flying in from somewhere, which is a different
 * and cheaper effect.
 */
export const distance = {
  rise: 12,
  riseLarge: 24,
} as const;

/** Per-item delay in a staggered group. */
export const stagger = {
  /** Between graphemes in a split heading — must stay small; a long word at
   *  0.06s/character takes several seconds to finish. */
  letter: 0.022,
  /** Between sibling cards or list rows. */
  item: 0.07,
} as const;

/**
 * The viewport trigger shared by every scroll reveal.
 *
 * `once` because a section that re-animates each time it re-enters turns
 * scrolling back up into a light show. The negative bottom margin holds the
 * reveal until the element is genuinely in view rather than one pixel past the
 * fold, which is what stops a fast scroll from arriving at a half-faded page.
 */
export const viewport = { once: true, margin: "0px 0px -12% 0px" } as const;
