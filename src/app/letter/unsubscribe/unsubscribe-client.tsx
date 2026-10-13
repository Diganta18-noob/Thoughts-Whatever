"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Check } from "lucide-react";
import { useLanguage } from "@/components/providers/language-provider";
import type { TranslationKey } from "@/lib/i18n/en";
import { cn } from "@/lib/utils";

type State = "idle" | "sending" | "done" | "error";

/** What `/api/unsubscribe` can answer with. See `subscribe-form.tsx`. */
const CODES: Record<string, TranslationKey> = {
  unsubscribed: "letter.msg.unsubscribed",
  missingToken: "letter.msg.missingToken",
  unknownToken: "letter.msg.unknownToken",
};

export function UnsubscribeClient({ token }: { token: string }) {
  const { t, locale, isBn } = useLanguage();
  const [state, setState] = useState<State>("idle");
  const [messageKey, setMessageKey] =
    useState<TranslationKey>("letter.msg.failed");

  async function confirm() {
    if (state === "sending") return;
    setState("sending");
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json()) as { ok?: boolean; code?: string };
      setMessageKey((data.code && CODES[data.code]) || "letter.msg.failed");
      setState(res.ok && data.ok ? "done" : "error");
    } catch {
      setState("error");
      setMessageKey("letter.msg.network");
    }
  }

  const body = isBn ? "font-bengali" : "font-serif";

  if (state === "done") {
    return (
      <div>
        <p
          lang={locale}
          className={cn(
            "flex items-center gap-2 text-bengali-base text-accent",
            body,
          )}
        >
          <Check className="h-4 w-4 shrink-0" />
          {t(messageKey)}
        </p>
        <p
          lang={locale}
          className={cn("mt-6 text-[0.9375rem] text-content-soft", body)}
        >
          {t("letter.unsubAfter")}
        </p>
        <Link
          href="/"
          lang={locale}
          className={cn(
            "mt-6 inline-block border-b border-accent text-[0.9375rem] text-accent transition hover:opacity-75",
            body,
          )}
        >
          {t("error.home")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p
        lang={locale}
        className={cn("text-bengali-base text-content-soft", body)}
      >
        {t("letter.unsubAsk")}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={confirm}
          disabled={state === "sending"}
          lang={locale}
          className={cn(
            "inline-flex items-center gap-2 rounded-sm bg-accent px-4 py-2 text-[0.9375rem] text-surface transition hover:opacity-90 disabled:opacity-50",
            body,
          )}
        >
          {state === "sending" && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("letter.unsubConfirm")}
        </button>
        <Link
          href="/letter"
          lang={locale}
          className={cn(
            "rounded-sm border border-rule px-4 py-2 text-[0.9375rem] text-content-soft transition hover:text-content",
            body,
          )}
        >
          {t("letter.unsubKeep")}
        </Link>
      </div>
      {state === "error" && (
        <p lang={locale} className={cn("mt-3 text-xs text-accent", body)}>
          {t(messageKey)}
        </p>
      )}
    </div>
  );
}
