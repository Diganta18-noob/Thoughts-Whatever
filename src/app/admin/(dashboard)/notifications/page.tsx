"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  Trash2,
  AlertTriangle,
  Info,
  AlertCircle,
  ExternalLink,
  Filter,
  CheckCheck,
} from "lucide-react";
import { toast } from "react-hot-toast";
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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterRead, setFilterRead] = useState<string>("all");
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchList = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterRead === "unread") params.set("unread", "true");
      if (filterSeverity !== "all") params.set("severity", filterSeverity);
      params.set("limit", "100");

      const res = await fetch(`/api/admin/notifications?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setNotifications(data.items);
        setUnreadCount(data.unreadCount);
      }
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [filterSeverity, filterRead]);

  const markAllAsRead = async () => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      toast.success("All notifications marked as read");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      toast.error("Action failed");
    }
  };

  const markSingle = async (id: string) => {
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
      toast.error("Action failed");
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await fetch(`/api/admin/notifications?id=${id}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success("Notification removed");
    } catch {
      toast.error("Failed to delete notification");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl font-normal text-content">
              Notification Center
            </h1>
            {unreadCount > 0 && (
              <span className="rounded bg-accent/10 px-2 py-0.5 font-mono text-xs font-semibold text-accent">
                {unreadCount} UNREAD
              </span>
            )}
          </div>
          <p className="mt-1 font-sans text-xs text-content-soft">
            Operational alerts, editorial warnings, security events, and scheduled job statuses.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 rounded-sm border border-rule bg-surface px-3 py-1.5 font-sans text-xs text-content hover:border-accent hover:text-accent transition"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          {["all", "unread"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterRead(tab)}
              className={cn(
                "rounded-sm px-3 py-1 font-sans text-xs capitalize transition",
                filterRead === tab
                  ? "bg-accent/10 font-semibold text-accent"
                  : "text-content-soft hover:text-content"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-content-faint" />
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            aria-label="Filter notifications by severity"
            className="rounded-sm border border-rule bg-surface-raised px-2.5 py-1 font-sans text-xs text-content focus:border-accent focus:outline-none"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical Only</option>
            <option value="warning">Warnings Only</option>
            <option value="info">Info Only</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="rounded-sm border border-rule bg-surface-raised divide-y divide-rule/70">
        {loading ? (
          <div className="p-12 text-center font-sans text-xs text-content-faint">
            Loading notification logs...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center font-sans text-xs text-content-faint">
            No notifications matching current filters.
          </div>
        ) : (
          notifications.map((n) => {
            return (
              <div
                key={n.id}
                className={cn(
                  "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 transition",
                  !n.read ? "bg-accent/5" : "hover:bg-surface/50"
                )}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 shrink-0">
                    {n.severity === "critical" ? (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    ) : n.severity === "warning" ? (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    ) : (
                      <Info className="h-4 w-4 text-accent" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-sans text-xs font-semibold text-content">
                        {n.title}
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-wider text-content-faint">
                        {n.type}
                      </span>
                      {!n.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                      )}
                    </div>
                    <p className="mt-1 font-sans text-xs text-content-soft leading-relaxed">
                      {n.message}
                    </p>
                    <p className="mt-1 font-mono text-[10px] text-content-faint">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  {n.actionUrl && (
                    <Link
                      href={n.actionUrl}
                      className="flex items-center gap-1 rounded-sm border border-rule px-2.5 py-1 font-sans text-xs text-accent hover:border-accent transition"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}

                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markSingle(n.id)}
                      className="rounded-sm p-1 text-content-soft hover:text-accent transition"
                      title="Mark as read"
                      aria-label="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => deleteItem(n.id)}
                    className="rounded-sm p-1 text-content-faint hover:text-red-600 transition"
                    title="Delete notification"
                    aria-label="Delete notification"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
