"use client";

import { TranslatedContent } from "@/components/i18n/translated-content";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";

export function Parallax({
  children,
  className,
  speed = 0.1,
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const percent = `${speed * 100}%`;
  const y = useTransform(scrollYProgress, [0, 1], [`-${percent}`, percent]);

  if (reduced) {
    return (
      <TranslatedContent><div ref={ref} className={className}>
        {children}
      </div></TranslatedContent>
    );
  }

  return (
    <TranslatedContent><div ref={ref} className={className}>
      <motion.div style={{ y }} className="h-full w-full will-change-transform">
        {children}
      </motion.div>
    </div></TranslatedContent>
  );
}
