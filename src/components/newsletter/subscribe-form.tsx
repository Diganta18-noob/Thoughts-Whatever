"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import type { TranslationKey } from "@/lib/i18n/en";
import { cn } from "@/lib/utils";
import { posthog } from "@/lib/posthog-client";


type State = "idle" | "sending" | "done" | "error";

/**
 * What `/api/subscribe` can answer with, mapped to what the reader sees.
 *
 * The route cannot know the interface language — it has no access to
 * localStorage — so it sends a code and the sentence is chosen here. An
 * unrecognised code falls back to the generic failure rather than showing the
 * reader a blank.
 */
const CODES: Record<string, TranslationKey> = {
  subscribed: "letter.msg.subscribed",
  invalidEmail: "letter.msg.invalidEmail",
  unreadable: "letter.msg.unreadable",
  saveFailed: "letter.msg.saveFailed",
};

/**
 * চিঠি — the newsletter form.
 *
 * Framed as a letter rather than a subscription. "চিঠি আসবে" promises a thing
 * a person sends; "Subscribe to our newsletter" promises a mailing list.
 *
 * The reply is held as a key, not as a sentence, so a message already on screen
 * follows the toggle instead of being stranded in the language it arrived in.
 */
export function SubscribeForm({
  source,
  compact = false,
  className,
}: {
  source: string;
  compact?: boolean;
  className?: string;
}) {
  const { t, locale, isBn } = useLanguage();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [messageKey, setMessageKey] =
    useState<TranslationKey>("letter.msg.failed");

  async function onSubmit(e: React.FormEvent) {

    e.preventDefault();
    if (state === "sending") return;

    posthog.capture("newsletter_started", { source });
    setState("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = (await res.json()) as { ok?: boolean; code?: string };
      const key: TranslationKey =
        (data.code && CODES[data.code]) || "letter.msg.failed";

      setMessageKey(key);
      if (res.ok && data.ok) {
        posthog.capture("newsletter_subscribed", { source });
        setState("done");
        setEmail("");
      } else {
        posthog.capture("newsletter_failed", { source, code: data.code });
        setState("error");
      }
    } catch {
      posthog.capture("newsletter_failed", { source, code: "network_error" });
      setState("error");
      setMessageKey("letter.msg.network");
    }
  }


  if (state === "done") {
    return (
      <p
        lang={locale}
        data-testid="subscribe-success-msg"
        className={cn(
          "flex items-center gap-2 text-[0.9375rem] text-accent",
          isBn ? "font-bengali" : "font-serif",
          className,
        )}
      >
        <Check className="h-4 w-4 shrink-0" />
        {t(messageKey)}
      </p>
    );
  }

  const field = cn(
    "text-[0.9375rem]",
    isBn ? "font-bengali" : "font-sans",
  );

  return (
    <form
      onSubmit={onSubmit}
      className={cn("w-full", compact ? "" : "max-w-sm", className)}
    >
      <div className="flex gap-2">
        <label className="sr-only" htmlFor={`subscribe-${source}`} lang={locale}>
          {t("letter.emailLabel")}
        </label>
        <input
          id={`subscribe-${source}`}
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "error") setState("idle");
          }}
          placeholder={t("letter.emailPlaceholder")}
          lang={locale}
          data-testid="subscribe-email-input"
          className={cn(
            field,
            "min-w-0 flex-1 border-b border-rule bg-transparent py-2 text-content outline-none transition-colors placeholder:text-content-faint focus:border-accent",
          )}
        />
        <button
          type="submit"
          disabled={state === "sending"}
          lang={locale}
          data-testid="subscribe-submit"
          className={cn(
            field,
            "shrink-0 border-b border-accent px-1 py-2 text-accent transition hover:opacity-75 disabled:opacity-50",
          )}
        >
          {state === "sending" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            t("letter.send")
          )}
        </button>
      </div>
      {state === "error" && (
        <p
          lang={locale}
          data-testid="subscribe-error-msg"
          className={cn(
            "mt-2 text-xs text-accent",
            isBn ? "font-bengali" : "font-sans",
          )}
        >
          {t(messageKey)}
        </p>
      )}
    </form>

  );
}
