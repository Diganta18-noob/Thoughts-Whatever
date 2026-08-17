import Image from "next/image";
import { SubscribeForm } from "@/components/newsletter/subscribe-form";
import { cn } from "@/lib/utils";

export function LetterBlock({
  source,
  className,
}: {
  source: string;
  className?: string;
}) {
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
