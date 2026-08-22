"use client";

import Link from "next/link";
import { Menu, ExternalLink } from "lucide-react";
import { useTranslation } from "@/components/providers/language-provider";
import { NotificationBell } from "@/components/admin/notification-bell";
import { AdminThemeToggle } from "@/components/admin/theme-toggle";
import { CommandPalette } from "@/components/admin/command-palette";

export function AdminHeaderBrand({ onToggleMobileMenu }: { onToggleMobileMenu?: () => void }) {
  const t = useTranslation();
  return (
    <div className="flex items-center gap-3">
      {onToggleMobileMenu && (
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="rounded p-1.5 text-content-soft hover:bg-surface-raised hover:text-content lg:hidden"
          title="Open Menu"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <Link href="/admin" className="flex items-center gap-2 group">
        <span className="font-serif text-lg font-bold tracking-tighter text-content group-hover:text-accent leading-none">
          t.w
        </span>
        <span className="h-3.5 w-[1px] bg-rule/80" />
        <span className="font-serif text-sm font-medium text-content group-hover:text-accent leading-none hidden sm:inline">
          Editor&apos;s Room
        </span>
      </Link>
    </div>
  );
}

export function AdminHeaderActions({ adminRole }: { adminRole?: string }) {
  const t = useTranslation();
  return (
    <div className="flex items-center gap-2.5 sm:gap-3.5">
      {/* Global Search & Command Palette */}
      <CommandPalette />

      {/* Notification Bell */}
      <NotificationBell />

      {/* Theme Toggle */}
      <AdminThemeToggle />

      {/* View Site Link */}
      <Link
        href="/"
        target="_blank"
        className="hidden sm:inline-flex items-center gap-1 font-sans text-xs text-content-soft transition hover:text-accent"
        title="Open public website in new tab"
      >
        {t("admin.viewSite")} <ExternalLink className="h-3 w-3" />
      </Link>
    </div>
  );
}

export function ViewSiteLink() {
  const t = useTranslation();
  return (
    <Link
      href="/"
      target="_blank"
      className="inline-flex items-center gap-1 font-sans text-xs text-content-soft transition hover:text-accent"
    >
      {t("admin.viewSite")} <ExternalLink className="h-3 w-3" />
    </Link>
  );
}
