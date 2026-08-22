"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Activity, ArrowRight, FileText, User, Shield, Database } from "lucide-react";

interface ActivityItem {
  id: string;
  type: string;
  summary: string;
  actorName?: string | null;
  actorEmail?: string | null;
  createdAt: string;
}

export function AdminActivityWidget() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/activity?limit=5")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) setActivities(data.activities);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getIcon = (type: string) => {
    if (type.startsWith("piece.") || type.startsWith("article.")) return FileText;
    if (type.startsWith("user.") || type.startsWith("team.")) return User;
    if (type.startsWith("security.") || type.startsWith("admin.login")) return Shield;
    if (type.startsWith("system.") || type.startsWith("backup.")) return Database;
    return Activity;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="label">
          Live Activity Stream
        </h2>
        <Link
          href="/admin/activity"
          className="font-sans text-xs text-content-soft hover:text-accent flex items-center gap-1 transition"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="rounded-sm border border-rule bg-surface-raised divide-y divide-rule/70">
        {loading ? (
          <p className="p-6 text-center font-sans text-xs text-content-faint">
            Loading activity stream...
          </p>
        ) : activities.length === 0 ? (
          <p className="p-6 text-center font-sans text-xs text-content-faint">
            No recent activity recorded.
          </p>
        ) : (
          activities.map((act) => {
            const Icon = getIcon(act.type);
            return (
              <div
                key={act.id}
                className="flex items-center justify-between gap-3 p-3.5 hover:bg-surface/30 transition text-xs font-sans"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-rule bg-surface text-content-soft">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-content truncate">
                      {act.summary}
                    </p>
                    <p className="font-mono text-[10px] text-content-faint">
                      by {act.actorName || act.actorEmail || "Automation"}
                    </p>
                  </div>
                </div>

                <span className="shrink-0 font-mono text-[10px] text-content-faint">
                  {new Date(act.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
