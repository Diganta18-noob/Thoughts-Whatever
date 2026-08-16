"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { useTranslation } from "@/components/providers/language-provider";

export function ForgotPasswordForm() {
  const t = useTranslation();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(t("admin.forgot.errorDefault"));
      return;
    }

    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      let data: { ok?: boolean; error?: string } = {};
      try {
        data = (await res.json()) as { ok?: boolean; error?: string };
      } catch {
        setError(
          res.ok
            ? t("admin.forgot.errorDefault")
            : t("admin.forgot.errorNetwork")
        );
        setBusy(false);
        return;
      }

      if (res.ok && data.ok) {
        setSubmitted(true);
        setBusy(false);
        return;
      }

      setError(data.error || t("admin.forgot.errorDefault"));
    } catch {
      setError(t("admin.forgot.errorNetwork"));
    }
    setBusy(false);
  }

  if (submitted) {
    return (
      <div className="mt-8 space-y-6 text-center" data-testid="forgot-success">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-lg font-medium text-content">
            {t("admin.forgot.successHeading")}
          </h2>
          <p className="text-sm leading-relaxed text-content-soft">
            {t("admin.forgot.successMessage")}
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/admin/login"
            className="inline-flex items-center justify-center gap-2 rounded-sm border border-rule px-4 py-2 text-sm text-content transition-colors hover:border-accent hover:text-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("admin.forgot.backToLogin")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="forgot-email" className="label block" lang="en">
          {t("admin.forgot.emailLabel")}
        </label>
        <input
          id="forgot-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          data-testid="forgot-email-input"
          placeholder="admin@example.com"
          className="mt-2 w-full border-b border-rule bg-transparent py-2 font-mono text-sm text-content outline-none transition-colors focus:border-accent"
        />
      </div>

      {error && (
        <p data-testid="forgot-error" className="text-[0.875rem] text-accent">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        data-testid="forgot-submit"
        className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-accent px-4 py-2.5 text-[0.9375rem] text-surface transition hover:opacity-90 disabled:opacity-50"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {busy ? t("admin.forgot.submitting") : t("admin.forgot.submit")}
      </button>

      <div className="pt-2 text-center">
        <Link
          href="/admin/login"
          className="text-xs text-content-soft transition-colors hover:text-accent focus:outline-none"
        >
          {t("admin.forgot.backToLogin")}
        </Link>
      </div>
    </form>
  );
}
