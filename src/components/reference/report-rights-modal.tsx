"use client";

import React, { useState } from "react";
import { ShieldAlert, X, Loader2, CheckCircle2 } from "lucide-react";
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
      toast.success("আপনার বার্তা সফলভাবে জমা হয়েছে।");
    } catch (err: any) {
      toast.error(err.message || "ত্রুটি ঘটেছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl p-6 text-zinc-100 my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg hover:bg-zinc-850"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-zinc-100">
              নোটিশ জমা সম্পন্ন হয়েছে
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-md mx-auto">
              Thoughts.Whatever কপিরাইট ও বৌদ্ধিক স্বত্বাধিকার রক্ষায় প্রতিশ্রুতিবদ্ধ। আমাদের সম্পাদকীয় দল প্রদত্ত তথ্য যাচাই করে প্রয়োজনীয় ব্যবস্থা গ্রহণ করবে।
            </p>
            <div className="pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-mono text-zinc-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg font-semibold"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 border-b border-zinc-850 pb-4 mb-4">
              <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-800/40 text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-zinc-100">
                  স্বত্ব বা কপিরাইট সংক্রান্ত আপত্তি / নোটিশ
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-1">{resourceTitle}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[0.7rem] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  আপনার নাম (Full Name) *
                </label>
                <input
                  type="text"
                  required
                  value={claimantName}
                  onChange={(e) => setClaimantName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[0.7rem] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  ইমেইল ঠিকানা (Email Address) *
                </label>
                <input
                  type="email"
                  required
                  value={claimantEmail}
                  onChange={(e) => setClaimantEmail(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[0.7rem] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  আপত্তির কারণ (Nature of Claim) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: সক্রিয় স্বত্বাধিকারী দাবি, মেয়াদকাল বা লাইসেন্স ত্রুটি"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[0.7rem] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  প্রমাণপত্র বা তথ্যসূত্র লিঙ্ক (Supporting Evidence URL)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={supportingUrl}
                  onChange={(e) => setSupportingUrl(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[0.7rem] font-mono uppercase tracking-wider text-zinc-400 mb-1">
                  বিস্তারিত বিবরণ (Detailed Message) *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="আপনার দাবি বা তথ্যের সুনির্দিষ্ট বিবরণ দিন..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-lg"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-semibold text-zinc-950 bg-rose-400 hover:bg-rose-300 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  নোটিশ জমা দিন
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
