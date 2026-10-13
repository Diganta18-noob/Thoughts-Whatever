"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function Magnetic({
  children,
  className,
  strength = 6,
}: {
  children: ReactNode;
  className?: string;
  /** Maximum offset in pixels. */
  strength?: number;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const [fine, setFine] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 26, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 220, damping: 26, mass: 0.4 });

  useEffect(() => {
    const query = window.matchMedia("(pointer: fine)");
    const sync = () => setFine(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const active = fine && !reduced;

  if (!active) return <span className={className}>{children}</span>;

  return (
    <motion.span
      ref={ref}
      className={className}
      style={{ x: springX, y: springY, display: "inline-block" }}
      onPointerMove={(event) => {
        const box = ref.current?.getBoundingClientRect();
        if (!box) return;
        const dx = (event.clientX - (box.left + box.width / 2)) / (box.width / 2);
        const dy = (event.clientY - (box.top + box.height / 2)) / (box.height / 2);
        x.set(Math.max(-1, Math.min(1, dx)) * strength);
        y.set(Math.max(-1, Math.min(1, dy)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}
