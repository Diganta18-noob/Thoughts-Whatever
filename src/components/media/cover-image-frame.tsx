"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CoverImage } from "@/components/media/cover-image";
import { type CoverOwner } from "@/lib/images";
import { hover } from "@/components/motion/motion-tokens";
import { cn } from "@/lib/utils";

export interface CoverImageFrameProps {
  owner: CoverOwner;
  slug: string;
  coverImage?: string | null;
  alt?: string;
  sizes: string;
  priority?: boolean;
  aspect?: string;
  rounded?: string;
  overlay?: boolean;
  scale?: number;
  className?: string;
}

export function CoverImageFrame({
  owner,
  slug,
  coverImage,
  alt = "",
  sizes,
  priority = false,
  aspect = "aspect-[3/4]",
  rounded = "rounded-sm",
  overlay = false,
  scale = hover.scale,
  className,
}: CoverImageFrameProps) {
  const prefersReduced = useReducedMotion();

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-journal-paperEdge transition-shadow duration-500 hover:shadow-xl",
        aspect,
        rounded,
        className,
      )}
    >
      <motion.div
        className="h-full w-full will-change-transform"
        whileHover={{
          scale: prefersReduced ? 1 : scale,
          transition: {
            duration: hover.duration,
            ease: hover.ease,
          },
        }}
      >
        <CoverImage
          owner={owner}
          slug={slug}
          coverImage={coverImage}
          alt={alt}
          sizes={sizes}
          priority={priority}
        />
      </motion.div>

      {overlay && (
        <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/10" />
      )}
    </div>
  );
}
