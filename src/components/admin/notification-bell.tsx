"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, Check, ExternalLink, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/admin/notifications?limit=6");
      const data = await res.json();
      if (data.ok) {
        setNotifications(data.items);
        setUnreadCount(data.unreadCount);
      }
    } catch {
      /* ignore background poll failures */
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000); // 45s poll
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const markAllRead = async () => {
    setLoading(true);
    try {
      await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markSingleRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex h-8 w-8 items-center justify-center rounded-sm border border-rule text-content-soft transition hover:border-accent hover:text-accent"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-bold text-white shadow-sm">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 sm:w-96 rounded-sm border border-rule bg-surface-raised p-4 shadow-xl animate-fade-up">
          <div className="flex items-center justify-between border-b border-rule pb-3">
            <div className="flex items-center gap-2">
              <span className="font-sans text-xs font-semibold uppercase tracking-wider text-content">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="rounded bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-accent">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                disabled={loading}
                className="font-sans text-xs text-content-soft hover:text-accent disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="mt-3 divide-y divide-rule/60 max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="py-6 text-center font-sans text-xs text-content-faint">
                No notifications right now.
              </p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex gap-3 py-3 transition",
                    !n.read ? "bg-accent/5 -mx-2 px-2 rounded-sm" : ""
                  )}
                >
                  <div className="mt-0.5 shrink-0">
                    {n.severity === "critical" ? (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    ) : n.severity === "warning" ? (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    ) : (
                      <Info className="h-4 w-4 text-accent" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-sans text-xs font-semibold text-content leading-snug">
                        {n.title}
                      </h4>
                      {!n.read && (
                        <button
                          type="button"
                          onClick={(e) => markSingleRead(n.id, e)}
                          title="Mark as read"
                          className="shrink-0 text-content-faint hover:text-accent"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <p className="mt-1 font-sans text-xs text-content-soft line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>

                    {n.actionUrl && (
                      <Link
                        href={n.actionUrl}
                        onClick={() => setOpen(false)}
                        className="mt-1.5 inline-flex items-center gap-1 font-sans text-[11px] text-accent hover:underline"
                      >
                        View Details <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-3 border-t border-rule pt-2.5 text-center">
            <Link
              href="/admin/notifications"
              onClick={() => setOpen(false)}
              className="font-sans text-xs font-medium text-accent hover:underline"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
