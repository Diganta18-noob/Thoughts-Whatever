import { T } from "@/components/i18n/t";
import { SubscribeForm } from "@/components/newsletter/subscribe-form";
import { cn } from "@/lib/utils";

/**
 * The framed version of the চিঠি form, used at the foot of pieces and on the
 * home page. The form itself stays bare so it can also sit in the footer
 * without a box around a box.
 *
 * All three strings here are the site's own invitation, not a reader's writing,
 * so they follow the interface language. This stays a server component — the
 * `<T>` leaves read the locale, so nothing above them has to.
 */
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
        "rounded-sm border border-rule bg-surface-raised px-6 py-7",
        className,
      )}
    >
      <T
        k="letter.label"
        className="label"
        bnClassName="font-bengali-sans tracking-normal"
      />
      <T
        as="h2"
        k="letter.blockTitle"
        className="mt-2 text-xl text-content"
        bnClassName="font-bengali"
      />
      <T
        as="p"
        k="letter.blockBody"
        className="mt-2 max-w-measure text-bengali-sm text-content-soft"
        bnClassName="font-bengali"
      />
      <SubscribeForm source={source} className="mt-5" />
    </aside>
  );
}
