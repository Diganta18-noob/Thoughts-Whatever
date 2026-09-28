"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/providers/language-provider";
import type { TranslationKey } from "@/lib/i18n/en";

export function LetterConfirmClient({ token }: { token: string }) {
  const { t, locale } = useLanguage();
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState<TranslationKey>("letter.msg.failed");

  async function confirm() {
    setState("sending");
    try {
      const response = await fetch("/api/subscribe/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await response.json()) as { ok?: boolean; code?: string };
      setMessage(response.ok && data.ok ? "letter.msg.confirmed" : "letter.msg.invalidConfirmation");
      setState(response.ok && data.ok ? "done" : "error");
    } catch {
      setMessage("letter.msg.network");
      setState("error");
    }
  }

  return (
    <div lang={locale}>
      <h1 className="font-serif text-3xl text-content">{t("letter.confirmTitle")}</h1>
      <p className="mt-4 text-content-soft">{t("letter.confirmIntro")}</p>
      {!token ? <p className="mt-6 text-accent">{t("letter.msg.invalidConfirmation")}</p> : state === "done" ? (
        <p className="mt-6 text-accent">{t(message)}</p>
      ) : (
        <>
          <button type="button" onClick={confirm} disabled={state === "sending"} className="mt-6 rounded-sm bg-accent px-5 py-3 text-white disabled:opacity-50">
            {state === "sending" ? t("common.loading") : t("letter.confirmButton")}
          </button>
          {state === "error" && <p className="mt-3 text-accent">{t(message)}</p>}
        </>
      )}
      <p className="mt-8"><Link href="/letter" className="text-accent underline">{t("common.back")}</Link></p>
    </div>
  );
}
