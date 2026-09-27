"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Laptop,
  Globe,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Lock,
  Key,
  CheckCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { confirmToast } from "@/lib/confirm-toast";
import { Button } from "@/components/ui";

interface ActiveSession {
  id: string;
  adminEmail: string;
  adminRole: string;
  userAgent: string;
  ipAddress: string;
  lastUsedAt: string;
  expiresAt: string;
}

interface SecurityAudit {
  id: string;
  action: string;
  summary: string;
  severity: string;
  ipAddress?: string | null;
  createdAt: string;
}

export default function SecurityCenterPage() {
  const [score, setScore] = useState<number>(100);
  const [issues, setIssues] = useState<string[]>([]);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [audits, setAudits] = useState<SecurityAudit[]>([]);
  const [metrics, setMetrics] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const fetchSecurity = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/security");
      const data = await res.json();
      if (data.ok) {
        setScore(data.securityScore);
        setIssues(data.issues);
        setSessions(data.activeSessions);
        setAudits(data.recentSecurityAudits);
        setMetrics(data.metrics);
      }
    } catch {
      toast.error("Failed to load security status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurity();
  }, []);

  const revokeSession = (sessionId: string) => {
    confirmToast(
      "Are you sure you want to revoke this session? The device will be logged out immediately.",
      async () => {
        try {
          const res = await fetch(`/api/admin/security?sessionId=${sessionId}`, { method: "DELETE" });
          const data = await res.json();
          if (data.ok) {
            toast.success("Session revoked");
            setSessions((prev) => prev.filter((s) => s.id !== sessionId));
            fetchSecurity();
          }
        } catch {
          toast.error("Failed to revoke session");
        }
      },
      { title: "Revoke Device Session", confirmLabel: "Revoke", variant: "danger" }
    );
  };

  const revokeAllSessions = () => {
    confirmToast(
      "Are you sure you want to revoke ALL active sessions across all devices? You will be prompted to log back in.",
      async () => {
        try {
          const res = await fetch(`/api/admin/security?all=true`, { method: "DELETE" });
          const data = await res.json();
          if (data.ok) {
            toast.success("All sessions revoked");
            fetchSecurity();
          }
        } catch {
          toast.error("Action failed");
        }
      },
      { title: "Revoke All Sessions", confirmLabel: "Revoke All", variant: "danger" }
    );
  };

  const getDeviceIcon = (ua: string) => {
    const lower = ua.toLowerCase();
    if (lower.includes("mobile") || lower.includes("android") || lower.includes("iphone")) {
      return Smartphone;
    }
    return Laptop;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-2xl font-normal text-content">
              Security Center
            </h1>
            <span
              className={cn(
                "rounded px-2 py-0.5 font-mono text-xs font-semibold uppercase",
                score >= 85
                  ? "bg-success/10 text-success"
                  : score >= 60
                  ? "bg-warning/10 text-warning"
                  : "bg-danger/10 text-danger"
              )}
            >
              SECURITY HEALTH: {score}/100
            </span>
          </div>
          <p className="mt-1 font-sans text-xs text-content-soft">
            Session surveillance, token rotation status, failed authentication detection, and threat monitoring.
          </p>
        </div>

        <button
          type="button"
          onClick={revokeAllSessions}
          className="flex items-center gap-1.5 rounded-sm border border-danger/40 bg-danger/10 bg-danger/40 px-3 py-1.5 font-sans text-xs text-danger hover:bg-danger/10 transition"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Revoke All Active Sessions
        </button>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-card border border-rule bg-surface-raised p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-content-faint">
              Active Sessions
            </span>
            <Globe className="h-4 w-4 text-accent" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-content">
            {metrics.activeSessionsCount ?? 0}
          </p>
          <p className="mt-1 font-sans text-[11px] text-content-faint">
            Across {metrics.totalAdmins ?? 1} admin account(s)
          </p>
        </div>

        <div className="rounded-card border border-rule bg-surface-raised p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-content-faint">
              Failed Logins (24h)
            </span>
            <ShieldAlert className="h-4 w-4 text-warning" />
          </div>
          <p className="mt-2 font-mono text-2xl font-bold text-content">
            {metrics.failedLogins24h ?? 0}
          </p>
          <p className="mt-1 font-sans text-[11px] text-content-faint">
            {metrics.failedLogins24h === 0 ? "Zero threats detected" : "Under surveillance"}
          </p>
        </div>

        <div className="rounded-card border border-rule bg-surface-raised p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-content-faint">
              JWT Policy
            </span>
            <Lock className="h-4 w-4 text-success" />
          </div>
          <p className="mt-2 font-sans text-sm font-semibold text-content">
            HS256 Dual-Token
          </p>
          <p className="mt-1 font-sans text-[11px] text-content-faint">
            15m Access / 30d Refresh Rotation
          </p>
        </div>

        <div className="rounded-card border border-rule bg-surface-raised p-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-content-faint">
              Cookie Armor
            </span>
            <CheckCircle className="h-4 w-4 text-success" />
          </div>
          <p className="mt-2 font-sans text-sm font-semibold text-content">
            HTTPOnly &bull; Lax
          </p>
          <p className="mt-1 font-sans text-[11px] text-content-faint">
            XSS & Open-Redirect Protected
          </p>
        </div>
      </div>

      {/* Issues & Warnings Bar (if any) */}
      {issues.length > 0 && (
        <div className="rounded-sm border border-warning/40 bg-warning/10 bg-warning/30 p-4 space-y-1">
          <div className="flex items-center gap-2 font-sans text-xs font-semibold text-warning">
            <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
            Security Observations & Recommendations
          </div>
          <ul className="list-disc list-inside text-xs font-sans text-warning pl-6 space-y-0.5">
            {issues.map((iss, i) => (
              <li key={i}>{iss}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Active Sessions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="label">
            Active Authenticated Sessions
          </h2>
          <button
            type="button"
            onClick={fetchSecurity}
            className="font-sans text-xs text-content-soft hover:text-accent flex items-center gap-1"
          >
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        <div className="rounded-card border border-rule bg-surface-raised divide-y divide-rule/70">
          {sessions.length === 0 ? (
            <p className="p-8 text-center font-sans text-xs text-content-faint">
              No active sessions found.
            </p>
          ) : (
            sessions.map((s) => {
              const DeviceIcon = getDeviceIcon(s.userAgent);
              return (
                <div
                  key={s.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-surface/30 transition"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="mt-0.5 rounded-card border border-rule bg-surface p-2 text-content-soft">
                      <DeviceIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-sans text-xs font-semibold text-content">
                          {s.adminEmail}
                        </span>
                        <span className="rounded bg-accent/10 px-1.5 py-0.2 font-mono text-[10px] text-accent">
                          {s.adminRole}
                        </span>
                        <span className="font-mono text-[11px] text-content-faint">
                          IP: {s.ipAddress}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-[11px] text-content-soft truncate max-w-xl">
                        {s.userAgent}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-content-faint">
                        Last Active: {new Date(s.lastUsedAt).toLocaleString()} &bull; Expires:{" "}
                        {new Date(s.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <Button variant="secondary" size="sm"
                    onClick={() => revokeSession(s.id)}
                    className="self-end sm:self-center hover:border-danger hover:text-danger"
                  >
                    <Trash2 className="h-3 w-3" />
                    Revoke
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Recent Security Audits */}
      <div className="space-y-4 pt-4">
        <h2 className="label">
          Recent Security Audit Trail
        </h2>

        <div className="rounded-card border border-rule bg-surface-raised divide-y divide-rule/70">
          {audits.length === 0 ? (
            <p className="p-8 text-center font-sans text-xs text-content-faint">
              No recent security incidents logged.
            </p>
          ) : (
            audits.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-4 px-4 py-3 text-xs font-sans hover:bg-surface/30 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      a.severity === "critical"
                        ? "bg-danger"
                        : a.severity === "warning"
                        ? "bg-warning"
                        : "bg-success"
                    )}
                  />
                  <div className="min-w-0">
                    <span className="font-semibold text-content block truncate">
                      {a.summary}
                    </span>
                    <span className="font-mono text-[10px] text-content-faint">
                      {a.action} {a.ipAddress && `• IP: ${a.ipAddress}`}
                    </span>
                  </div>
                </div>

                <span className="shrink-0 font-mono text-[10px] text-content-faint">
                  {new Date(a.createdAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
