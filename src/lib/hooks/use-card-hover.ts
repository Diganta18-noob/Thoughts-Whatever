"use client";

import { useReducedMotion } from "framer-motion";
import { hover } from "@/components/motion/motion-tokens";

export interface UseCardHoverOptions {
  scale?: number;
  cardRise?: number;
  duration?: number;
}

export function useCardHover(options: UseCardHoverOptions = {}) {
  const prefersReduced = useReducedMotion();

  const scale = options.scale ?? hover.scale;
  const cardRise = options.cardRise ?? hover.cardRise;
  const duration = options.duration ?? hover.duration;

  // Respect prefers-reduced-motion: skip Y lift if reduced motion is enabled
  const targetY = prefersReduced ? 0 : cardRise;

  const cardMotionProps = {
    whileHover: {
      y: targetY,
      transition: {
        duration,
        ease: hover.ease,
      },
    },
  };

  const imageMotionProps = {
    whileHover: {
      scale: prefersReduced ? 1 : scale,
      transition: {
        duration,
        ease: hover.ease,
      },
    },
  };

  return {
    cardMotionProps,
    imageMotionProps,
    prefersReduced,
  };
}
