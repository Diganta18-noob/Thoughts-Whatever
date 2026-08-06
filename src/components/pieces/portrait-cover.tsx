"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface PortraitCoverProps {
  src: string;
  alt: string;
  width?: number | null;
  height?: number | null;
  priority?: boolean;
  aspectRatio?: "9/16" | "3/4" | "4/5" | "auto";
  className?: string;
  containerClassName?: string;
  showAmbientBlur?: boolean;
  size?: "sm" | "md" | "lg" | "hero";
}

export function PortraitCover({
  src,
  alt,
  width,
  height,
  priority = false,
  aspectRatio = "3/4",
  className,
  containerClassName,
  showAmbientBlur = true,
  size = "md",
}: PortraitCoverProps) {
  const [loaded, setLoaded] = useState(false);

  // Size preset max height & widths
  const sizeClasses = {
    sm: "max-h-[16rem] w-auto",
    md: "max-h-[22rem] w-auto sm:max-h-[26rem]",
    lg: "max-h-[28rem] w-auto sm:max-h-[32rem]",
    hero: "max-h-[32rem] w-auto sm:max-h-[38rem]",
  };

  const aspectStyle =
    aspectRatio === "auto" && width && height
      ? `${width} / ${height}`
      : aspectRatio === "9/16"
      ? "9/16"
      : aspectRatio === "4/5"
      ? "4/5"
      : "3/4";

  return (
    <div className={cn("relative group/portrait-cover flex items-center justify-center", containerClassName)}>
      {/* 1. Optional Ambient Blur Backdrop */}
      {showAmbientBlur && (
        <div
          className="absolute -inset-1 rounded-2xl bg-cover bg-center blur-2xl opacity-20 transition-opacity duration-500 group-hover/portrait-cover:opacity-35 pointer-events-none"
          style={{ backgroundImage: `url(${src})` }}
        />
      )}

      {/* 2. Main Portrait Container Frame */}
      <motion.div
        whileHover={{ scale: 1.025, y: -2 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "relative overflow-hidden rounded-xl sm:rounded-2xl border border-rule/50 bg-transparent shadow-md transition-shadow duration-300 group-hover/portrait-cover:shadow-xl group-hover/portrait-cover:border-accent/40 w-full",
          sizeClasses[size],
          className
        )}
        style={{ aspectRatio: aspectStyle }}
      >
        {/* Pulse Skeleton placeholder */}
        {!loaded && (
          <div className="absolute inset-0 bg-surface-raised/40 animate-pulse" />
        )}

        <Image
          src={src}
          alt={alt}
          width={width || 600}
          height={height || 800}
          priority={priority}
          unoptimized={src.startsWith("data:")}
          onLoad={() => setLoaded(true)}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-500",
            loaded ? "opacity-100" : "opacity-0"
          )}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </motion.div>

    </div>
  );
}
