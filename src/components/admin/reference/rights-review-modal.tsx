"use client";

import React, { useState } from "react";
import { ReferenceRightsStatus } from "@prisma/client";
import { RightsBadge } from "./rights-badge";
import { ShieldCheck, AlertTriangle, History, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button, Input, NativeSelect, Textarea } from "@/components/ui";

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
      <div className="relative w-full max-w-2xl bg-surface border border-rule rounded-card shadow-2xl p-6 text-content-faint my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-content-faint hover:text-content-faint/80 p-1.5 rounded-lg hover:bg-surface-raised/60"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-rule pb-4 mb-5">
          <div className="p-2.5 rounded-lg bg-success/40 border border-success/40 text-success">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-content-faint">
              Rights Evaluation & Legal Review
            </h2>
            <p className="text-xs text-content-faint line-clamp-1">{workTitle}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-surface-raised/60 border border-rule/80 rounded-card p-3.5 flex items-center justify-between">
            <span className="text-xs text-content-faint">Current Rights State:</span>
            <RightsBadge status={currentStatus} />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1.5">
              New Rights Decision Status *
            </label>
            <NativeSelect
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ReferenceRightsStatus)}
            >
              <option value="PUBLIC_DOMAIN">PUBLIC_DOMAIN (Verified Free of Restrictions)</option>
              <option value="LICENSED">LICENSED (Explicit License / Rights Holder Permission)</option>
              <option value="EXTERNAL_SOURCE">EXTERNAL_SOURCE (Direct Catalog Link, No Hosting)</option>
              <option value="RIGHTS_UNVERIFIED">RIGHTS_UNVERIFIED (Requires Copyright Verification)</option>
              <option value="RESTRICTED">RESTRICTED (Active Copyright, Bibliographic Info Only)</option>
            </NativeSelect>
          </div>

          {newStatus === "RIGHTS_UNVERIFIED" && (
            <div className="p-3 bg-warning/30 border border-warning/40 rounded-lg flex items-start gap-2 text-warning text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Invariant Active:</strong> Unverified items cannot host downloaded files on Thoughts.Whatever. Users will only be able to view the bibliographic entry and external source link.
              </span>
            </div>
          )}

          {newStatus === "RESTRICTED" && (
            <div className="p-3 bg-danger/30 border border-danger/40 rounded-lg flex items-start gap-2 text-danger text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Invariant Active:</strong> Restricted works cannot expose hosted downloads or online reader files. External hosting mode will be enforced.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                License Designation
              </label>
              <Input
                type="text"
                placeholder="e.g. Public Domain Mark 1.0, CC BY-SA 4.0"
                value={license}
                onChange={(e) => setLicense(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
                Rights Holder / Authority
              </label>
              <Input
                type="text"
                placeholder="e.g. Estate of author, Publisher, Public Domain"
                value={rightsHolder}
                onChange={(e) => setRightsHolder(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
              Evidence URL (Catalog / Gazette / Copyright Record)
            </label>
            <Input
              type="url"
              placeholder="https://archive.org/... or https://copyright.gov.in/..."
              value={evidenceUrl}
              onChange={(e) => setEvidenceUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
              Decision Reason (Mandatory for Audit Trail) *
            </label>
            <Input
              type="text"
              required
              placeholder="e.g. Author died in 1941, 60-year post-mortem term expired under Section 22"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-content-faint mb-1">
              Verification Notes & Archival Context
            </label>
            <Textarea
              rows={2}
              placeholder="Additional legal justification, edition comparison, or institutional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
            />
          </div>

          {auditLogs.length > 0 && (
            <div className="mt-4 pt-4 border-t border-rule">
              <h4 className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-content-faint mb-2">
                <History className="w-3.5 h-3.5" /> Immutable Rights History
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2 bg-surface-raised/50 border border-rule/60 rounded-card text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-content-faint">
                      <span>{log.changedBy}</span>
                      <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-content-faint">
                      <span className="font-mono text-content-faint">{log.previousStatus}</span>
                      {" → "}
                      <span className="font-mono font-medium text-success">{log.newStatus}</span>
                    </div>
                    <p className="text-content-faint italic">{log.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-rule">
            <Button variant="secondary"
              onClick={onClose}
              className="hover:text-content-faint/80"
            >
              Cancel
            </Button>
            <Button variant="success"
              type="submit"
              disabled={isSubmitting}
              className="px-5"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Commit Rights Decision
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
