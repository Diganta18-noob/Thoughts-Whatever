"use client";

import React, { useState } from "react";
import { ReferenceRightsStatus } from "@prisma/client";
import { RightsBadgeMeta } from "@/lib/reference/rights-engine";
import { ReferenceRightsBadge } from "@/components/reference/reference-rights-badge";
import { ReportRightsModal } from "@/components/reference/report-rights-modal";
import { ChevronDown, ChevronUp, ExternalLink, Flag } from "lucide-react";

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
    <div className="border-t border-rule pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 label text-content hover:text-accent transition-colors"
        >
          <span>Rights & Provenance Dossier</span>
          {isExpanded ? (
            <ChevronUp className="h-3 w-3 text-content-faint" />
          ) : (
            <ChevronDown className="h-3 w-3 text-content-faint" />
          )}
        </button>

        <button
          onClick={() => setIsReportOpen(true)}
          className="label !text-content-faint hover:!text-accent flex items-center gap-1 transition-colors"
        >
          <Flag className="h-3 w-3" />
          <span>Report Rights Issue</span>
        </button>
      </div>

      {isExpanded && (
        <div className="border border-rule/80 bg-surface-raised p-5 space-y-3.5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ReferenceRightsBadge status={rightsStatus} size="md" />
              <span className="font-serif text-content-soft font-medium">
                {rightsMeta.labelEn}
              </span>
            </div>
            {verifiedAt && (
              <span className="font-mono text-content-faint text-[0.6875rem]">
                Verified: {new Date(verifiedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          <p className="font-serif text-content-soft text-xs leading-relaxed">
            {rightsMeta.descriptionEn}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-rule/60 text-xs font-serif">
            {license && (
              <div>
                <span className="label block text-[0.625rem]">License</span>
                <span className="text-content">{license}</span>
              </div>
            )}
            {rightsHolder && (
              <div>
                <span className="label block text-[0.625rem]">Authority / Rights Holder</span>
                <span className="text-content">{rightsHolder}</span>
              </div>
            )}
            {evidenceUrl && (
              <div className="sm:col-span-2">
                <span className="label block text-[0.625rem]">Verification Evidence</span>
                <a
                  href={evidenceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:underline inline-flex items-center gap-1 truncate"
                >
                  <span className="truncate">{evidenceUrl}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>
            )}
          </div>

          <p className="border-t border-rule/50 pt-2.5 font-serif text-[0.6875rem] text-content-faint leading-relaxed italic">
            Thoughts.Whatever operates strictly under the Copyright Act, 1957 (India) and international copyright conventions. Works are cataloged for scholarly reference, and downloadable copies are restricted solely to confirmed public-domain or licensed editions.
          </p>
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
