"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  FileText,
  User,
  Shield,
  Database,
  Tag,
  FolderTree,
  RefreshCw,
  Clock,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  type: string;
  summary: string;
  entityType?: string | null;
  entityId?: string | null;
  actorEmail?: string | null;
  actorName?: string | null;
  createdAt: string;
  metadata?: any;
}

export default function ActivityFeedPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== "all") params.set("type", filterType);
      params.set("page", page.toString());
      params.set("limit", "25");

      const res = await fetch(`/api/admin/activity?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setActivities(data.activities);
        setTotalPages(data.pagination.totalPages || 1);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [filterType, page]);

  const getActivityIcon = (type: string) => {
    if (type.startsWith("piece.") || type.startsWith("article.")) return FileText;
    if (type.startsWith("user.") || type.startsWith("team.")) return User;
    if (type.startsWith("security.") || type.startsWith("admin.login")) return Shield;
    if (type.startsWith("system.") || type.startsWith("backup.")) return Database;
    if (type.startsWith("series.")) return FolderTree;
    if (type.startsWith("tag.") || type.startsWith("author.")) return Tag;
    return Activity;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl font-normal text-content">
              Real-Time Activity Feed
            </h1>
            <span className="flex items-center gap-1.5 rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-pulse" />
              LIVE
            </span>
          </div>
          <p className="mt-1 font-sans text-xs text-content-soft">
            Chronological audit of editorial publishing, database actions, role changes, and system events.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchActivities}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-sm border border-rule bg-surface px-3 py-1.5 font-sans text-xs text-content hover:border-accent hover:text-accent transition disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1">
          {[
            { id: "all", label: "All Activities" },
            { id: "piece", label: "Articles" },
            { id: "user", label: "Users & Team" },
            { id: "system", label: "System & Ops" },
            { id: "security", label: "Security" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setFilterType(tab.id);
                setPage(1);
              }}
              className={cn(
                "rounded-sm px-3 py-1 font-sans text-xs transition",
                filterType === tab.id
                  ? "bg-accent/10 font-semibold text-accent"
                  : "text-content-soft hover:text-content"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="rounded-sm border border-rule bg-surface-raised p-6">
        {loading ? (
          <div className="py-16 text-center font-sans text-xs text-content-faint">
            Loading activity stream...
          </div>
        ) : activities.length === 0 ? (
          <div className="py-16 text-center font-sans text-xs text-content-faint">
            No activities recorded in this category.
          </div>
        ) : (
          <div className="relative border-l border-rule/80 pl-6 ml-3 space-y-6">
            {activities.map((act) => {
              const Icon = getActivityIcon(act.type);
              return (
                <div key={act.id} className="relative group">
                  {/* Timeline bullet */}
                  <div className="absolute -left-[31px] top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-rule bg-surface-raised text-content-soft group-hover:border-accent group-hover:text-accent transition">
                    <Icon className="h-2.5 w-2.5" />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <div className="min-w-0">
                      <p className="font-sans text-xs font-semibold text-content leading-snug">
                        {act.summary}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 font-sans text-[11px] text-content-soft">
                        <span>
                          by{" "}
                          <strong className="font-medium text-content">
                            {act.actorName || act.actorEmail || "System Automation"}
                          </strong>
                        </span>
                        {act.entityType && (
                          <>
                            <span className="text-rule">•</span>
                            <span className="font-mono text-[10px] text-content-faint uppercase">
                              {act.entityType}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <span className="shrink-0 font-mono text-[10px] text-content-faint">
                      {new Date(act.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between border-t border-rule pt-4 text-xs font-sans">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-sm border border-rule px-3 py-1 hover:border-accent disabled:opacity-30"
            >
              Previous
            </button>
            <span className="font-mono text-content-faint">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-sm border border-rule px-3 py-1 hover:border-accent disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
