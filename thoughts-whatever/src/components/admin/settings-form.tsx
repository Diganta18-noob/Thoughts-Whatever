"use client";

import { useState } from "react";
import { Loader2, Download, Key, UserPlus } from "lucide-react";

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
        setPasswordNotice("পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setPasswordNotice(data.error || "পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।");
      }
    } catch {
      setPasswordNotice("সংযোগে সমস্যা হয়েছে।");
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
        setAdminNotice("নতুন এডমিন অ্যাকাউন্ট তৈরি হয়েছে।");
        setNewAdminEmail("");
        setNewAdminName("");
        setNewAdminPassword("");
      } else {
        setAdminNotice(data.error || "এডমিন যোগ করা ব্যর্থ হয়েছে।");
      }
    } catch {
      setAdminNotice("সংযোগে সমস্যা হয়েছে।");
    } finally {
      setAdminBusy(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Export / Backup Section */}
      <div className="border border-rule bg-surface p-6 space-y-4">
        <div>
          <span className="label" lang="en">
            Data Backup & Export
          </span>
          <h2 className="mt-1 font-bengali text-lg font-medium text-content" lang="bn">
            প্ল্যাটফর্ম ডাটা ব্যাকআপ
          </h2>
          <p className="mt-1 font-bengali text-xs text-content-soft" lang="bn">
            সমস্ত লেখা, তথ্যচিত্র, বিভাগ ও সাবস্ক্রাইবার পরিসংখ্যান JSON ফাইলে ডাউনলোড করুন।
          </p>
        </div>

        <a
          href="/api/admin/settings?export=true"
          className="inline-flex items-center gap-2 rounded-sm bg-accent px-4 py-2 font-bengali text-sm text-surface transition hover:opacity-90"
        >
          <Download className="h-4 w-4" />
          সম্পূর্ণ ব্যাকআপ ডাউনলোড (JSON)
        </a>
      </div>

      {/* Password Change */}
      <form onSubmit={handlePasswordChange} className="border border-rule bg-surface p-6 space-y-4">
        <div>
          <span className="label" lang="en">
            Security Settings
          </span>
          <h2 className="mt-1 font-bengali text-lg font-medium text-content" lang="bn">
            পাসওয়ার্ড পরিবর্তন ({currentAdminEmail})
          </h2>
        </div>

        {passwordNotice && (
          <p className="border-l-2 border-accent pl-3 font-bengali text-xs text-accent" lang="bn">
            {passwordNotice}
          </p>
        )}

        <div className="space-y-3">
          <div>
            <label className="label block mb-1" lang="en">
              Current Password
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
            <label className="label block mb-1" lang="en">
              New Password
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
          className="inline-flex items-center gap-2 rounded-sm bg-accent px-4 py-2 font-bengali text-sm text-surface transition hover:opacity-90 disabled:opacity-50"
        >
          {passwordBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
          পাসওয়ার্ড আপডেট করুন
        </button>
      </form>

      {/* Add Admin User */}
      <form onSubmit={handleAddAdmin} className="border border-rule bg-surface p-6 space-y-4">
        <div>
          <span className="label" lang="en">
            User Management
          </span>
          <h2 className="mt-1 font-bengali text-lg font-medium text-content" lang="bn">
            নতুন এডমিন যোগ করুন
          </h2>
        </div>

        {adminNotice && (
          <p className="border-l-2 border-accent pl-3 font-bengali text-xs text-accent" lang="bn">
            {adminNotice}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label block mb-1" lang="en">
              Email Address
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
            <label className="label block mb-1" lang="en">
              Name (Bengali)
            </label>
            <input
              type="text"
              value={newAdminName}
              onChange={(e) => setNewAdminName(e.target.value)}
              placeholder="আপনার নাম"
              lang="bn"
              className="w-full rounded-sm border border-rule bg-surface px-3 py-2 font-bengali text-sm text-content outline-none focus:border-accent"
            />
          </div>
        </div>

        <div>
          <label className="label block mb-1" lang="en">
            Password
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
          className="inline-flex items-center gap-2 rounded-sm bg-accent px-4 py-2 font-bengali text-sm text-surface transition hover:opacity-90 disabled:opacity-50"
        >
          {adminBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          এডমিন যোগ করুন
        </button>

        {/* Existing Admin list */}
        <div className="pt-4 border-t border-rule space-y-2">
          <span className="label block" lang="en">
            Current Admins
          </span>
          <ul className="divide-y divide-rule/60">
            {adminUsers.map((user) => (
              <li key={user.id} className="py-2 flex items-center justify-between text-xs font-mono">
                <span className="text-content font-medium">{user.email}</span>
                <span className="text-content-faint font-bengali" lang="bn">
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
