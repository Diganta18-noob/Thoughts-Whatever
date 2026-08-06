"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTranslation } from "@/components/providers/language-provider";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const t = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data: { ok?: boolean; error?: string } = {};
      try {
        data = (await res.json()) as { ok?: boolean; error?: string };
      } catch {
        setError(
          res.ok
            ? t("admin.login.errorDefault")
            : t("admin.login.errorNetwork"),
        );
        setBusy(false);
        return;
      }

      if (res.ok && data.ok) {
        // `refresh()` before navigating, or the layout's server-side auth check
        // runs against the cached (logged-out) render and bounces straight back.
        router.refresh();
        router.replace(next);
        return;
      }
      setError(data.error || t("admin.login.errorDefault"));
    } catch {
      setError(t("admin.login.errorNetwork"));
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <div>
        <label
          htmlFor="email"
          className="label block"
          lang="en"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          data-testid="email-input"
          className="mt-2 w-full border-b border-rule bg-transparent py-2 font-mono text-sm text-content outline-none transition-colors focus:border-accent"
        />
      </div>

      <div>
        <label htmlFor="password" className="label block" lang="en">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          data-testid="password-input"
          className="mt-2 w-full border-b border-rule bg-transparent py-2 font-mono text-sm text-content outline-none transition-colors focus:border-accent"
        />
      </div>

      {error && (
        <p data-testid="login-error" className="text-[0.875rem] text-accent">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        data-testid="login-submit"
        className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-accent px-4 py-2.5 text-[0.9375rem] text-surface transition hover:opacity-90 disabled:opacity-50"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("admin.login.submit")}
      </button>
    </form>

  );
}
