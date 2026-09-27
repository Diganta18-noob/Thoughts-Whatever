"use client";

import React, { useState, useEffect } from "react";
import { TakedownStatus } from "@prisma/client";
import { ShieldAlert, X, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui";

interface ReferenceClaimsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReferenceClaimsModal({
  isOpen,
  onClose,
}: ReferenceClaimsModalProps) {
  const [claims, setClaims] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchClaims();
    }
  }, [isOpen]);

  async function fetchClaims() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/reference/claims");
      const data = await res.json();
      if (data.claims) setClaims(data.claims);
    } catch {
      toast.error("Failed to load claims");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStatusUpdate(claimId: string, status: TakedownStatus) {
    setUpdatingId(claimId);
    try {
      const res = await fetch("/api/admin/reference/claims", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Claim marked as ${status}`);
      setClaims((prev) =>
        prev.map((c) => (c.id === claimId ? { ...c, status } : c)),
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update claim");
    } finally {
      setUpdatingId(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-surface border border-rule rounded-card shadow-2xl p-6 text-content-faint my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-content-faint hover:text-content-faint/80 p-1.5 rounded-lg hover:bg-surface-raised/60"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-rule pb-4 mb-5">
          <div className="p-2.5 rounded-lg bg-danger/40 border border-danger/40 text-danger">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-content-faint">
              Copyright Inquiries & Takedown Claims
            </h2>
            <p className="text-xs text-content-faint">
              Community and rights-holder notices under Indian Copyright Act
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center items-center text-content-faint">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading claims...
          </div>
        ) : claims.length === 0 ? (
          <div className="py-12 text-center text-content-faint text-sm">
            No copyright inquiries or takedown claims submitted.
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {claims.map((c) => (
              <div
                key={c.id}
                className="p-4 bg-surface-raised/60 border border-rule rounded-card space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-content-faint">
                    {c.resourceTitle}
                  </span>
                  <span
                    className={`text-[0.65rem] font-mono px-2 py-0.5 rounded uppercase ${
                      c.status === "OPEN"
                        ? "bg-warning/60 text-warning border border-warning/40"
                        : c.status === "RESOLVED"
                        ? "bg-success/60 text-success border border-success/40"
                        : "bg-surface-raised text-content-soft"
                    }`}
                  >
                    {c.status}
                  </span>
                </div>

                <div className="text-xs text-content-faint flex flex-wrap gap-x-4 gap-y-1">
                  <span>Claimant: <strong className="text-content-faint">{c.claimantName}</strong> ({c.claimantEmail})</span>
                  <span>Date: {new Date(c.createdAt).toLocaleDateString()}</span>
                  {c.supportingUrl && (
                    <a
                      href={c.supportingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-success hover:underline"
                    >
                      Evidence Link ↗
                    </a>
                  )}
                </div>

                <p className="text-xs text-content-faint bg-surface/60 p-2.5 rounded-card border border-rule/80">
                  {c.message}
                </p>

                <div className="flex items-center justify-end gap-2 pt-2">
                  {c.status !== "RESOLVED" && (
                    <button
                      disabled={updatingId === c.id}
                      onClick={() => handleStatusUpdate(c.id, "RESOLVED")}
                      className="px-3 py-1 bg-success/60 hover:bg-success/80 border border-success/40 text-success rounded text-xs flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolve Claim
                    </button>
                  )}
                  {c.status !== "REJECTED" && (
                    <Button variant="secondary" size="sm"
                      disabled={updatingId === c.id}
                      onClick={() => handleStatusUpdate(c.id, "REJECTED")}
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject Claim
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-rule mt-4">
          <Button variant="secondary"
            onClick={onClose}
            className="hover:text-content-faint/80"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
