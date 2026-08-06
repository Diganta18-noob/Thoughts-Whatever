import Image from "next/image";
import { coverSrc, isOptimizable, type CoverOwner } from "@/lib/images";
import { cn } from "@/lib/utils";

export function FillImage({
  src,
  alt = "",
  sizes,
  priority = false,
  className,
}: {
  src: string;
  alt?: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const shared = cn("object-cover", className);

  if (!isOptimizable(src)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={cn("absolute inset-0 h-full w-full", shared)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={shared}
    />
  );
}

export function CoverImage({
  owner,
  slug,
  coverImage,
  alt = "",
  sizes,
  priority = false,
  className,
}: {
  owner: CoverOwner;
  slug: string;
  coverImage?: string | null;
  alt?: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const src = coverSrc(owner, slug, coverImage);
  if (!src) return null;

  return (
    <FillImage
      src={src}
      alt={alt}
      sizes={sizes}
      priority={priority}
      className={className}
    />
  );
}
