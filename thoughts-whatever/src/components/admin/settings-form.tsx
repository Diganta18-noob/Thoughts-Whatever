"use client";

import { useState } from "react";
import { Loader2, Download, Key, UserPlus, Globe } from "lucide-react";
import { useLanguage, useTranslation } from "@/components/providers/language-provider";

interface AdminUserItem {
  id: string;
  email: string;
  nameBn: string | null;
  createdAt: string | Date;
}

interface SettingsFormProps {
  adminUsers: AdminUserItem[];
  currentAdminEmail: string;
}

export function SettingsForm({ adminUsers, currentAdminEmail }: SettingsFormProps) {
  const { locale, setLocale } = useLanguage();
  const t = useTranslation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);

  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [adminNotice, setAdminNotice] = useState("");
  const [adminBusy, setAdminBusy] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordBusy(true);
    setPasswordNotice("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "changePassword",
          currentPassword,
          newPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setPasswordNotice(t("admin.settings.passwordSuccess"));
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setPasswordNotice(data.error || t("admin.settings.passwordError"));
      }
    } catch {
      setPasswordNotice(t("letter.msg.network"));
    } finally {
      setPasswordBusy(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminBusy(true);
    setAdminNotice("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addAdmin",
          email: newAdminEmail,
          nameBn: newAdminName,
          newPassword: newAdminPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setAdminNotice(t("admin.settings.addAdminSuccess"));
        setNewAdminEmail("");
        setNewAdminName("");
        setNewAdminPassword("");
      } else {
        setAdminNotice(data.error || t("admin.settings.addAdminError"));
      }
    } catch {
      setAdminNotice(t("letter.msg.network"));
    } finally {
      setAdminBusy(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Language Switcher Section */}
      <div className="border border-rule bg-surface p-6 space-y-4">
        <div>
          <span className="label block">
            {t("lang.label")}
          </span>
          <h2 className="mt-1 font-sans text-lg font-medium text-content">
            {t("admin.settings.languageTitle")}
          </h2>
          <p className="mt-1 font-sans text-xs text-content-soft">
            {t("admin.settings.languageDesc")}
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setLocale("en")}
            className={`inline-flex items-center gap-2 rounded-sm px-4 py-2 text-sm transition border ${
              locale === "en"
                ? "bg-accent text-surface border-accent font-medium"
                : "bg-surface text-content border-rule hover:border-content-soft"
            }`}
          >
            <Globe className="h-4 w-4" />
            {t("lang.english")}
          </button>

          <button
            type="button"
            onClick={() => setLocale("bn")}
            className={`inline-flex items-center gap-2 rounded-sm px-4 py-2 text-sm transition border ${
              locale === "bn"
                ? "bg-accent text-surface border-accent font-medium"
                : "bg-surface text-content border-rule hover:border-content-soft"
            }`}
          >
            <Globe className="h-4 w-4" />
            {t("lang.bengali")}
          </button>
        </div>
      </div>

      {/* Export / Backup Section */}
      <div className="border border-rule bg-surface p-6 space-y-4">
        <div>
          <span className="label block">
            {t("admin.settings.backupTitle")}
          </span>
          <h2 className="mt-1 font-sans text-lg font-medium text-content">
            {t("admin.settings.backupTitle")}
          </h2>
          <p className="mt-1 font-sans text-xs text-content-soft">
            {t("admin.settings.backupDesc")}
          </p>
        </div>

        <a
          href="/api/admin/settings?export=true"
          className="inline-flex items-center gap-2 rounded-sm bg-accent px-4 py-2 font-sans text-sm text-surface transition hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          {t("admin.settings.backupBtn")}
        </a>
      </div>

      {/* Password Change */}
      <form onSubmit={handlePasswordChange} className="border border-rule bg-surface p-6 space-y-4">
        <div>
          <span className="label block">
            {t("admin.settings.securityTitle")}
          </span>
          <h2 className="mt-1 font-sans text-lg font-medium text-content">
            {t("admin.settings.passwordChange", { email: currentAdminEmail })}
          </h2>
        </div>

        {passwordNotice && (
          <p className="border-l-2 border-accent pl-3 font-sans text-xs text-accent">
            {passwordNotice}
          </p>
        )}

        <div className="space-y-3">
          <div>
            <label className="label block mb-1">
              {t("admin.settings.currentPassword")}
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full rounded-sm border border-rule bg-surface px-3 py-2 font-mono text-xs text-content outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="label block mb-1">
              {t("admin.settings.newPassword")}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full rounded-sm border border-rule bg-surface px-3 py-2 font-mono text-xs text-content outline-none focus:border-accent"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={passwordBusy}
          className="inline-flex items-center gap-2 rounded-sm bg-accent px-4 py-2 font-sans text-sm text-surface transition hover:opacity-90 disabled:opacity-50"
        >
          {passwordBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
          {t("admin.settings.updatePasswordBtn")}
        </button>
      </form>

      {/* Add Admin User */}
      <form onSubmit={handleAddAdmin} className="border border-rule bg-surface p-6 space-y-4">
        <div>
          <span className="label block">
            {t("admin.settings.userMgmtTitle")}
          </span>
          <h2 className="mt-1 font-sans text-lg font-medium text-content">
            {t("admin.settings.addAdmin")}
          </h2>
        </div>

        {adminNotice && (
          <p className="border-l-2 border-accent pl-3 font-sans text-xs text-accent">
            {adminNotice}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label block mb-1">
              {t("admin.settings.emailAddress")}
            </label>
            <input
              type="email"
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              required
              placeholder="admin@example.com"
              className="w-full rounded-sm border border-rule bg-surface px-3 py-2 font-mono text-xs text-content outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="label block mb-1">
              {t("admin.settings.nameBengali")}
            </label>
            <input
              type="text"
              value={newAdminName}
              onChange={(e) => setNewAdminName(e.target.value)}
              placeholder={t("admin.editor.namePlaceholder")}
              className="w-full rounded-sm border border-rule bg-surface px-3 py-2 font-sans text-sm text-content outline-none focus:border-accent"
            />
          </div>
        </div>

        <div>
          <label className="label block mb-1">
            {t("admin.settings.newPassword")}
          </label>
          <input
            type="password"
            value={newAdminPassword}
            onChange={(e) => setNewAdminPassword(e.target.value)}
            required
            className="w-full rounded-sm border border-rule bg-surface px-3 py-2 font-mono text-xs text-content outline-none focus:border-accent"
          />
        </div>

        <button
          type="submit"
          disabled={adminBusy}
          className="inline-flex items-center gap-2 rounded-sm bg-accent px-4 py-2 font-sans text-sm text-surface transition hover:opacity-90 disabled:opacity-50"
        >
          {adminBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          {t("admin.settings.addAdminBtn")}
        </button>

        {/* Existing Admin list */}
        <div className="pt-4 border-t border-rule space-y-2">
          <span className="label block">
            {t("admin.settings.currentAdmins")}
          </span>
          <ul className="divide-y divide-rule/60">
            {adminUsers.map((user) => (
              <li key={user.id} className="py-2 flex items-center justify-between text-xs font-mono">
                <span className="text-content font-medium">{user.email}</span>
                <span className="text-content-faint">
                  {user.nameBn || "—"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </form>
    </div>
  );
}
