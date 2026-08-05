"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { analyzeImage, probeImageDimensions, type EditorialLayout } from "@/lib/image-meta";

export interface EditorialImageProps {
  src: string;
  alt: string;
  width?: number | null;
  height?: number | null;
  priority?: boolean;
  layout?: EditorialLayout | "auto";
  className?: string;
  aspectRatioOverride?: string; // e.g. "aspect-video"
  showBorder?: boolean;
  children?: React.ReactNode; // Optional right-side content for split layout
}

export function EditorialImage({
  src,
  alt,
  width,
  height,
  priority = false,
  layout: requestedLayout = "auto",
  className,
  aspectRatioOverride,
  showBorder = true,
  children,
}: EditorialImageProps) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(
    width && height ? { width, height } : null
  );
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  // Probe dimensions client-side if missing
  useEffect(() => {
    if (!dimensions && src) {
      probeImageDimensions(src).then((meta) => {
        if (meta) setDimensions(meta);
      });
    }
  }, [src, dimensions]);

  // IntersectionObserver for lazy entrance animations
  useEffect(() => {
    if (priority || !containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [priority]);

  const meta = analyzeImage(dimensions?.width, dimensions?.height);
  const activeLayout: EditorialLayout =
    requestedLayout === "auto"
      ? meta?.layout || "hero"
      : requestedLayout;

  // Determine aspect ratio class or style
  const computedAspectRatio = dimensions
    ? `${dimensions.width} / ${dimensions.height}`
    : undefined;

  // Render Skeleton while un-probed or loading
  const renderSkeleton = !loaded && (
    <div
      className="absolute inset-0 bg-surface-raised/60 animate-pulse transition-opacity duration-300"
      style={{ aspectRatio: computedAspectRatio }}
    />
  );

  // 1. Split Layout (Portrait: image 35-40% width on left, text on right)
  if (activeLayout === "split" && children) {
    return (
      <div
        ref={containerRef}
        className={cn(
          "grid gap-6 md:grid-cols-[2fr_3fr] md:items-center py-4",
          inView && "editorial-image-reveal",
          className
        )}
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-sm bg-surface-raised/40 flex items-center justify-center mx-auto w-full max-w-sm md:max-w-none",
            showBorder && "border border-rule"
          )}
          style={{ aspectRatio: computedAspectRatio || "3/4" }}
        >
          {renderSkeleton}
          <Image
            src={src}
            alt={alt}
            width={dimensions?.width || 800}
            height={dimensions?.height || 1066}
            priority={priority}
            unoptimized={src.startsWith("data:")}
            onLoad={() => setLoaded(true)}
            className={cn(
              "w-full h-full object-contain transition-transform duration-700 hover:scale-[1.02]",
              loaded ? "opacity-100" : "opacity-0"
            )}
            sizes="(max-width: 768px) 100vw, 40vw"
          />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    );
  }

  // 2. Default Image Frame for Hero, Card, or Banner Layouts
  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden rounded-sm bg-surface-raised/40 flex items-center justify-center w-full",
        showBorder && "border border-rule",
        aspectRatioOverride,
        inView && "editorial-image-reveal",
        className
      )}
      style={{
        aspectRatio: aspectRatioOverride ? undefined : (computedAspectRatio || (activeLayout === "card" ? "1/1" : "16/9")),
      }}
    >
      {renderSkeleton}
      <Image
        src={src}
        alt={alt}
        width={dimensions?.width || 1200}
        height={dimensions?.height || 675}
        priority={priority}
        unoptimized={src.startsWith("data:")}
        onLoad={() => setLoaded(true)}
        className={cn(
          "w-full h-full object-contain transition-transform duration-700 hover:scale-[1.02]",
          loaded ? "opacity-100" : "opacity-0"
        )}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
      />
    </div>
  );
}
