import { cn } from "@/lib/utils";

interface ArticleSignatureProps {
  className?: string;
}

/**
 * ArticleSignature
 *
 * Renders the authoritative, literary author signature at the end of every
 * document / article / story on Thoughts Whatever.
 *
 * Aesthetic:
 * - Uses `--font-latin-serif` (Fraunces / Latin literary serif).
 * - Understated editorial elegance with gentle italic posture.
 * - Generous vertical rhythm matching editorial book publishing.
 */
export function ArticleSignature({ className }: ArticleSignatureProps) {
  return (
    <div
      className={cn(
        "my-12 sm:my-16 select-none flex items-center justify-start text-content-soft",
        className
      )}
      aria-label="Author signature: thoughts.whatever"
    >
      <span className="font-latin-serif italic text-base sm:text-lg tracking-wide text-content-soft opacity-85">
        — thoughts.whatever
      </span>
    </div>
  );
}
