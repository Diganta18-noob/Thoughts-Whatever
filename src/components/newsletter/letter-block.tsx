import Image from "next/image";
import { SubscribeForm } from "@/components/newsletter/subscribe-form";
import { cn } from "@/lib/utils";

export function LetterBlock({
  source,
  className,
  variant = "full",
}: {
  source: string;
  className?: string;
  variant?: "full" | "sidebar";
}) {
  if (variant === "sidebar") {
    return (
      <aside
        data-print="hide"
        className={cn(
          "relative overflow-hidden rounded-xl border border-rule/60 bg-surface-raised shadow-xl flex flex-col",
          className,
        )}
      >
        {/* Top atmospheric visual banner */}
        <div className="relative h-32 w-full overflow-hidden shrink-0">
          <Image
            src="/brand/letter-desk.jpg"
            alt="Vintage journal, fountain pen, and warm tea"
            fill
            sizes="300px"
            className="object-cover object-center"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-raised via-surface-raised/40 to-transparent"
          />
        </div>

        {/* Content & Form */}
        <div className="relative z-10 p-5 sm:p-6 flex flex-col justify-center">
          <span className="text-[0.7rem] uppercase tracking-[0.16em] text-accent font-mono font-medium mb-1.5">
            THE LETTER
          </span>

          <h2 className="font-serif text-xl text-content font-medium leading-tight">
            One letter a month
          </h2>

          <p className="mt-2 text-xs leading-relaxed text-content-soft font-sans">
            New writing, things worth reading, and whatever got cut along the way. No ads, no three emails a week.
          </p>

          <div className="mt-5 w-full">
            <SubscribeForm source={source} compact className="w-full" />
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      data-print="hide"
      className={cn(
        "relative overflow-hidden rounded-lg border border-rule/60 bg-surface-raised shadow-xl",
        className,
      )}
    >
      <div className="grid lg:grid-cols-[1.1fr_0.9fr] items-center min-h-[280px]">
        {/* Left Side: Content & Subscription Form */}
        <div className="relative z-10 p-6 sm:p-10 flex flex-col justify-center">
          <span className="text-[0.7rem] uppercase tracking-[0.16em] text-accent font-mono font-medium mb-2.5">
            THE LETTER
          </span>

          <h2 className="font-serif text-2xl sm:text-3xl text-content font-medium leading-tight">
            One letter a month
          </h2>

          <p className="mt-2.5 max-w-md text-xs sm:text-sm leading-relaxed text-content-soft font-sans">
            New writing, things worth reading, and whatever got cut along the way. No ads, no three emails a week.
          </p>

          <div className="mt-6 max-w-md">
            <SubscribeForm source={source} />
          </div>
        </div>

        {/* Right Side: Background Image with Gradient Mask */}
        <div className="relative h-48 lg:h-full w-full overflow-hidden">
          <Image
            src="/brand/letter-desk.jpg"
            alt="Vintage journal, fountain pen, and warm tea"
            fill
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover object-center"
          />
          {/* Gradient Overlay for smooth blending */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-surface-raised via-surface-raised/50 to-transparent"
          />
        </div>
      </div>
    </aside>
  );
}
