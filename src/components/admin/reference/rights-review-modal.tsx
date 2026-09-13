"use client";

import React, { useState } from "react";
import { ReferenceRightsStatus } from "@prisma/client";
import { RightsBadge } from "./rights-badge";
import { ShieldCheck, AlertTriangle, History, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface RightsReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  workId: string;
  workTitle: string;
  currentStatus: ReferenceRightsStatus;
  currentLicense?: string | null;
  currentRightsHolder?: string | null;
  currentEvidenceUrl?: string | null;
  currentNotes?: string | null;
  auditLogs?: Array<{
    id: string;
    previousStatus: ReferenceRightsStatus;
    newStatus: ReferenceRightsStatus;
    changedBy: string;
    reason: string;
    notes?: string | null;
    evidenceUrl?: string | null;
    createdAt: string | Date;
  }>;
}

export function RightsReviewModal({
  isOpen,
  onClose,
  onSuccess,
  workId,
  workTitle,
  currentStatus,
  currentLicense = "",
  currentRightsHolder = "",
  currentEvidenceUrl = "",
  currentNotes = "",
  auditLogs = [],
}: RightsReviewModalProps) {
  const [newStatus, setNewStatus] = useState<ReferenceRightsStatus>(currentStatus);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState(currentNotes || "");
  const [evidenceUrl, setEvidenceUrl] = useState(currentEvidenceUrl || "");
  const [license, setLicense] = useState(currentLicense || "");
  const [rightsHolder, setRightsHolder] = useState(currentRightsHolder || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error("Please provide a reason for this rights decision.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/reference/${workId}/rights-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newStatus,
          reason,
          notes,
          evidenceUrl,
          license,
          rightsHolder,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update rights status");
      }

      toast.success(data.message || "Rights review decision recorded successfully.");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Could not record rights decision");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-6 text-zinc-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg hover:bg-zinc-800/60"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-zinc-800 pb-4 mb-5">
          <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-zinc-100">
              Rights Evaluation & Legal Review
            </h2>
            <p className="text-xs text-zinc-400 line-clamp-1">{workTitle}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-lg p-3.5 flex items-center justify-between">
            <span className="text-xs text-zinc-400">Current Rights State:</span>
            <RightsBadge status={currentStatus} />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              New Rights Decision Status *
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ReferenceRightsStatus)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
            >
              <option value="PUBLIC_DOMAIN">PUBLIC_DOMAIN (Verified Free of Restrictions)</option>
              <option value="LICENSED">LICENSED (Explicit License / Rights Holder Permission)</option>
              <option value="EXTERNAL_SOURCE">EXTERNAL_SOURCE (Direct Catalog Link, No Hosting)</option>
              <option value="RIGHTS_UNVERIFIED">RIGHTS_UNVERIFIED (Requires Copyright Verification)</option>
              <option value="RESTRICTED">RESTRICTED (Active Copyright, Bibliographic Info Only)</option>
            </select>
          </div>

          {newStatus === "RIGHTS_UNVERIFIED" && (
            <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-lg flex items-start gap-2 text-amber-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Invariant Active:</strong> Unverified items cannot host downloaded files on Thoughts.Whatever. Users will only be able to view the bibliographic entry and external source link.
              </span>
            </div>
          )}

          {newStatus === "RESTRICTED" && (
            <div className="p-3 bg-rose-950/30 border border-rose-800/40 rounded-lg flex items-start gap-2 text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Invariant Active:</strong> Restricted works cannot expose hosted downloads or online reader files. External hosting mode will be enforced.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                License Designation
              </label>
              <input
                type="text"
                placeholder="e.g. Public Domain Mark 1.0, CC BY-SA 4.0"
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
                Rights Holder / Authority
              </label>
              <input
                type="text"
                placeholder="e.g. Estate of author, Publisher, Public Domain"
                value={rightsHolder}
                onChange={(e) => setRightsHolder(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
              Evidence URL (Catalog / Gazette / Copyright Record)
            </label>
            <input
              type="url"
              placeholder="https://archive.org/... or https://copyright.gov.in/..."
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
              Decision Reason (Mandatory for Audit Trail) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Author died in 1941, 60-year post-mortem term expired under Section 22"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1">
              Verification Notes & Archival Context
            </label>
            <textarea
              rows={2}
              placeholder="Additional legal justification, edition comparison, or institutional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {auditLogs.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <h4 className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
                <History className="w-3.5 h-3.5" /> Immutable Rights History
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2 bg-zinc-900/50 border border-zinc-800/60 rounded text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>{log.changedBy}</span>
                      <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-zinc-200">
                      <span className="font-mono text-zinc-400">{log.previousStatus}</span>
                      {" → "}
                      <span className="font-mono font-medium text-emerald-400">{log.newStatus}</span>
                    </div>
                    <p className="text-zinc-300 italic">{log.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-100 border border-zinc-800 rounded-lg hover:bg-zinc-800/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-semibold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Commit Rights Decision
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
