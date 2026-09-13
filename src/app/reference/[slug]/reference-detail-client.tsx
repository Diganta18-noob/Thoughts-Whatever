"use client";

import React, { useState } from "react";
import { ReferenceRightsStatus } from "@prisma/client";
import { RightsBadgeMeta } from "@/lib/reference/rights-engine";
import { ReferenceRightsBadge } from "@/components/reference/reference-rights-badge";
import { ReportRightsModal } from "@/components/reference/report-rights-modal";
import { ShieldCheck, ChevronDown, ChevronUp, AlertCircle, ExternalLink, Flag } from "lucide-react";

interface ReferenceDetailClientProps {
  rightsStatus: ReferenceRightsStatus;
  rightsMeta: RightsBadgeMeta;
  license?: string | null;
  rightsHolder?: string | null;
  evidenceUrl?: string | null;
  verifiedAt?: string | Date | null;
  workTitle: string;
  workSlug: string;
}

export function ReferenceDetailClient({
  rightsStatus,
  rightsMeta,
  license,
  rightsHolder,
  evidenceUrl,
  verifiedAt,
  workTitle,
  workSlug,
}: ReferenceDetailClientProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isReportOpen, setIsReportOpen] = useState(false);

  return (
    <div className="pt-6 border-t border-zinc-800/80 space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-zinc-300 hover:text-zinc-100 transition-colors"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>স্বত্ব ও প্রত্যয়ন বিবরণী (Rights & Attribution)</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          )}
        </button>

        <button
          onClick={() => setIsReportOpen(true)}
          className="text-xs font-mono text-zinc-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
        >
          <Flag className="w-3 h-3" />
          <span>স্বত্ব সংক্রান্ত আপত্তি জানান</span>
        </button>
      </div>

      {isExpanded && (
        <div className="p-5 rounded-xl bg-zinc-950/70 border border-zinc-850 space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ReferenceRightsBadge status={rightsStatus} size="md" />
              <span className="font-serif text-zinc-300 text-sm">{rightsMeta.labelBn}</span>
            </div>
            {verifiedAt && (
              <span className="font-mono text-zinc-500 text-[0.7rem]">
                যাচাইয়ের তারিখ: {new Date(verifiedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          <p className="text-zinc-300 leading-relaxed font-sans">
            {rightsMeta.descriptionBn}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-900 text-zinc-400 font-mono text-[0.75rem]">
            {license && (
              <div>
                <span className="text-zinc-500 block">লাইসেন্স শর্ত:</span>
                <span className="text-zinc-200">{license}</span>
              </div>
            )}
            {rightsHolder && (
              <div>
                <span className="text-zinc-500 block">স্বত্বাধিকারী / কর্তৃপক্ষ:</span>
                <span className="text-zinc-200">{rightsHolder}</span>
              </div>
            )}
            {evidenceUrl && (
              <div className="sm:col-span-2">
                <span className="text-zinc-500 block">আইনি প্রমাণপত্র বা তথ্যসূত্র:</span>
                <a
                  href={evidenceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-400 hover:underline flex items-center gap-1 truncate"
                >
                  <span className="truncate">{evidenceUrl}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            )}
          </div>

          <div className="p-3 bg-zinc-900/50 border border-zinc-850 rounded text-zinc-400 text-[0.7rem] leading-relaxed">
            <strong>Thoughts.Whatever অধিকার নীতি:</strong> ভারতীয় কপিরাইট আইন (Copyright Act, 1957) ও আন্তর্জাতিক চুক্তি মেনে কেবল যাচাইকৃত পাবলিক ডোমেইন বা অনুমোদিত সাহিত্যকর্ম সরাসরি হোস্ট করা হয়। অন্যথায় কেবল রেফারেন্স লিংক ও গ্রন্থপঞ্জি তথ্য প্রদর্শিত হয়।
          </div>
        </div>
      )}

      {/* Report Rights Issue Modal */}
      <ReportRightsModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        resourceTitle={workTitle}
        workSlug={workSlug}
      />
    </div>
  );
}
