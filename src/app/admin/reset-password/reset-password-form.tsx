"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, AlertCircle, ArrowRight, RefreshCw } from "lucide-react";
import { useTranslation } from "@/components/providers/language-provider";

export function ResetPasswordForm() {
  const t = useTranslation();
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tokenErrorCode, setTokenErrorCode] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Read token from URL query string on mount
    const params = new URLSearchParams(window.location.search);
    const rawToken = params.get("token");

    if (rawToken && rawToken.trim()) {
      setToken(rawToken.trim());
      // Security / Privacy: Strip token from URL immediately to prevent exfiltration to PostHog
      window.history.replaceState(null, "", window.location.pathname);
    } else {
      setToken(null);
    }
    setInitialized(true);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;

    if (!token) {
      setError(t("admin.reset.errorMissingToken"));
      return;
    }

    if (password.length < 8) {
      setError(t("admin.reset.errorMinLength"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("admin.reset.errorMismatch"));
      return;
    }

    setBusy(true);
    setError("");
    setTokenErrorCode(null);

    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      let data: { ok?: boolean; error?: string; code?: string } = {};
      try {
        data = (await res.json()) as { ok?: boolean; error?: string; code?: string };
      } catch {
        setError(t("admin.reset.errorNetwork"));
        setBusy(false);
        return;
      }

      if (res.ok && data.ok) {
        setSuccess(true);
        setBusy(false);
        return;
      }

      if (data.code === "TOKEN_EXPIRED") {
        setTokenErrorCode("TOKEN_EXPIRED");
        setError(t("admin.reset.errorExpired"));
      } else if (data.code === "TOKEN_ALREADY_USED") {
        setTokenErrorCode("TOKEN_ALREADY_USED");
        setError(t("admin.reset.errorUsed"));
      } else if (data.code === "TOKEN_INVALID") {
        setTokenErrorCode("TOKEN_INVALID");
        setError(t("admin.reset.errorInvalid"));
      } else {
        setError(data.error || t("admin.reset.errorNetwork"));
      }
    } catch {
      setError(t("admin.reset.errorNetwork"));
    }
    setBusy(false);
  }

  if (!initialized) {
    return (
      <div className="mt-8 flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-content-soft" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="mt-8 space-y-6 text-center" data-testid="reset-success">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-lg font-medium text-content">
            {t("admin.reset.successHeading")}
          </h2>
          <p className="text-sm leading-relaxed text-content-soft">
            {t("admin.reset.successMessage")}
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/admin/login"
            className="inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-5 py-2.5 text-sm font-medium text-surface transition hover:opacity-90"
          >
            {t("admin.reset.continueToLogin")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Token missing on load
  if (!token && !tokenErrorCode) {
    return (
      <div className="mt-8 space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-lg font-medium text-content">
            {t("admin.reset.heading")}
          </h2>
          <p data-testid="reset-error" className="text-sm leading-relaxed text-accent">
            {t("admin.reset.errorMissingToken")}
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/admin/forgot-password"
            className="inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-4 py-2.5 text-sm font-medium text-surface transition hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" />
            {t("admin.reset.requestNewLink")}
          </Link>
        </div>
      </div>
    );
  }

  // Terminal token error (expired, already used, or invalid)
  if (tokenErrorCode) {
    return (
      <div className="mt-8 space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-lg font-medium text-content">
            {t("admin.reset.heading")}
          </h2>
          <p data-testid="reset-error" className="text-sm leading-relaxed text-accent">
            {error}
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/admin/forgot-password"
            className="inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-4 py-2.5 text-sm font-medium text-surface transition hover:opacity-90"
          >
            <RefreshCw className="h-4 w-4" />
            {t("admin.reset.requestNewLink")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="reset-password" className="label block" lang="en">
          {t("admin.reset.passwordLabel")}
        </label>
        <input
          id="reset-password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          data-testid="reset-password-input"
          placeholder="••••••••"
          className="mt-2 w-full border-b border-rule bg-transparent py-2 font-mono text-sm text-content outline-none transition-colors focus:border-accent"
        />
      </div>

      <div>
        <label htmlFor="reset-confirm-password" className="label block" lang="en">
          {t("admin.reset.confirmPasswordLabel")}
        </label>
        <input
          id="reset-confirm-password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          data-testid="reset-confirm-password-input"
          placeholder="••••••••"
          className="mt-2 w-full border-b border-rule bg-transparent py-2 font-mono text-sm text-content outline-none transition-colors focus:border-accent"
        />
      </div>

      {error && (
        <p data-testid="reset-error" className="text-[0.875rem] text-accent">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        data-testid="reset-submit"
        className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-accent px-4 py-2.5 text-[0.9375rem] text-surface transition hover:opacity-90 disabled:opacity-50"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {busy ? t("admin.reset.submitting") : t("admin.reset.submit")}
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
