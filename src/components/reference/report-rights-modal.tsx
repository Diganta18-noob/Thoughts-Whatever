"use client";

import React, { useState } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

interface ReportRightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceTitle: string;
  workSlug: string;
}

export function ReportRightsModal({
  isOpen,
  onClose,
  resourceTitle,
  workSlug,
}: ReportRightsModalProps) {
  const [claimantName, setClaimantName] = useState("");
  const [claimantEmail, setClaimantEmail] = useState("");
  const [reason, setReason] = useState("");
  const [supportingUrl, setSupportingUrl] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/reference/takedown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workSlug,
          resourceTitle,
          claimantName,
          claimantEmail,
          reason,
          supportingUrl: supportingUrl || undefined,
          message,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");

      setIsSuccess(true);
      toast.success("Notice submitted successfully.");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit rights notice.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-surface border border-rule p-6 sm:p-8 text-content my-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-content-faint hover:text-content p-1"
        >
          <X className="h-4 w-4" />
        </button>

        {isSuccess ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
            <h3 className="font-serif text-lg font-medium text-content">
              Notice Received
            </h3>
            <p className="text-xs text-content-soft leading-relaxed max-w-sm mx-auto font-serif">
              Thoughts.Whatever respects intellectual property rights. Our editorial team will review the submitted notice within 48 hours.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="label border border-rule px-4 py-2 hover:border-content transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="border-b border-rule pb-3 mb-5">
              <span className="label block">Rights Notice</span>
              <h3 className="font-serif text-lg font-medium text-content mt-1">
                Report a Rights or Copyright Concern
              </h3>
              <p className="text-xs text-content-faint font-bengali line-clamp-1 mt-0.5">
                {resourceTitle}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-serif">
              <div>
                <label className="label block mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  value={claimantName}
                  onChange={(e) => setClaimantName(e.target.value)}
                  className="w-full bg-surface-raised border border-rule px-3 py-2 text-content focus:border-accent focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="label block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={claimantEmail}
                  onChange={(e) => setClaimantEmail(e.target.value)}
                  className="w-full bg-surface-raised border border-rule px-3 py-2 text-content focus:border-accent focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="label block mb-1">Nature of Concern *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Active copyright claim, translation licensing dispute"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-surface-raised border border-rule px-3 py-2 text-content focus:border-accent focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="label block mb-1">Supporting Evidence / Catalog URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={supportingUrl}
                  onChange={(e) => setSupportingUrl(e.target.value)}
                  className="w-full bg-surface-raised border border-rule px-3 py-2 text-content focus:border-accent focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="label block mb-1">Detailed Explanation *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Please provide specifics regarding the rights status of this edition..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-surface-raised border border-rule px-3 py-2 text-content focus:border-accent focus:outline-none text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-rule">
                <button
                  type="button"
                  onClick={onClose}
                  className="label border border-rule px-3 py-1.5 hover:border-content text-content-faint transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="label bg-content text-surface px-4 py-1.5 hover:bg-content-soft transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>Submit Notice</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
