"use client";

import { useState, useEffect } from "react";

export default function SystemHealthPage() {
  const [health, setHealth] = useState<any>(null);
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hRes, bRes] = await Promise.all([
        fetch("/api/admin/system-health"),
        fetch("/api/admin/backup"),
      ]);
      const hData = await hRes.json();
      const bData = await bRes.json();
      setHealth(hData);
      setBackups(bData.backups || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunMaintenance = async () => {
    setIsProcessing(true);
    setActionMessage("Running Server Maintenance...");
    try {
      const res = await fetch("/api/admin/maintenance", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setActionMessage("Maintenance completed successfully!");
      } else {
        setActionMessage(`Maintenance failed: ${data.error}`);
      }
      fetchData();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunBackup = async () => {
    setIsProcessing(true);
    setActionMessage("Creating full system backup...");
    try {
      const res = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "full" }),
      });
      const data = await res.json();
      if (data.ok) {
        setActionMessage(`Backup created: ${data.result.backupId}`);
      } else {
        setActionMessage(`Backup failed: ${data.error}`);
      }
      fetchData();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async (backupId: string) => {
    if (!confirm(`Are you sure you want to restore backup ${backupId}? This will overwrite current data.`)) return;

    setIsProcessing(true);
    setActionMessage(`Restoring backup ${backupId}...`);
    try {
      const res = await fetch("/api/admin/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupId, scope: "full" }),
      });
      const data = await res.json();
      if (data.ok) {
        setActionMessage(`Restoration completed successfully!`);
      } else {
        setActionMessage(`Restoration failed: ${data.error}`);
      }
      fetchData();
    } catch (err: any) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return <div className="p-8 font-sans text-sm text-content-soft">Loading system status...</div>;
  }

  const statusColor =
    health?.status === "HEALTHY"
      ? "text-emerald-500 bg-emerald-500/10"
      : health?.status === "DEGRADED"
      ? "text-amber-500 bg-amber-500/10"
      : "text-rose-500 bg-rose-500/10";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-normal text-content">System Health & Backups</h1>
          <p className="font-sans text-xs text-content-soft mt-1">
            Server maintenance, disaster recovery and backup status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunMaintenance}
            disabled={isProcessing}
            className="rounded bg-surface-hover px-4 py-2 font-sans text-xs font-medium text-content transition hover:bg-rule disabled:opacity-50"
          >
            Run Maintenance
          </button>
          <button
            onClick={handleRunBackup}
            disabled={isProcessing}
            className="rounded bg-accent px-4 py-2 font-sans text-xs font-medium text-white transition hover:bg-accent/90 disabled:opacity-50"
          >
            Create Backup Now
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="rounded border border-accent/20 bg-accent/5 p-4 font-sans text-xs text-accent">
          {actionMessage}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-rule bg-surface p-4">
          <span className="font-sans text-xs text-content-faint">Overall Status</span>
          <div className="mt-2 flex items-center justify-between">
            <span className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold ${statusColor}`}>
              {health?.status}
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-rule bg-surface p-4">
          <span className="font-sans text-xs text-content-faint">Disk Space</span>
          <p className="mt-1 font-mono text-sm text-content">{health?.checks?.diskSpace?.details}</p>
        </div>

        <div className="rounded-lg border border-rule bg-surface p-4">
          <span className="font-sans text-xs text-content-faint">Last Backup</span>
          <p className="mt-1 font-mono text-xs text-content">{health?.checks?.lastBackup?.details}</p>
        </div>

        <div className="rounded-lg border border-rule bg-surface p-4">
          <span className="font-sans text-xs text-content-faint">R2 Cloud Storage</span>
          <p className="mt-1 font-mono text-xs text-content">{health?.checks?.r2Connectivity?.details}</p>
        </div>
      </div>

      {/* Backup Browser */}
      <div className="rounded-lg border border-rule bg-surface p-6">
        <h2 className="font-serif text-lg text-content mb-4">Available Backups ({backups.length})</h2>
        <div className="divide-y divide-rule">
          {backups.map((b) => (
            <div key={b.backupId} className="flex flex-wrap items-center justify-between gap-4 py-3">
              <div>
                <span className="font-mono text-xs font-medium text-content">{b.backupId}</span>
                <span className="ml-3 font-sans text-xs text-content-faint">
                  {new Date(b.timestamp).toLocaleString()}
                </span>
                <span className="ml-2 font-mono text-[0.6875rem] uppercase text-accent">{b.type}</span>
              </div>

              <div className="flex items-center gap-4">
                <span className="font-sans text-xs text-content-soft">
                  {b.verified ? "Verified ✅" : "Unverified ⚠️"}
                </span>
                <button
                  onClick={() => handleRestore(b.backupId)}
                  disabled={isProcessing}
                  className="rounded border border-rule px-3 py-1 font-sans text-xs transition hover:bg-surface-hover disabled:opacity-50"
                >
                  Restore
                </button>
              </div>
            </div>
          ))}

          {backups.length === 0 && (
            <p className="py-4 font-sans text-xs text-content-soft">No backups found in local storage.</p>
          )}
        </div>
      </div>
    </div>
  );
}
