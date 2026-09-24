import {
  ReferenceRightsStatus,
  ReferenceHostingMode,
  ReferenceAssetKind,
} from "@prisma/client";

/**
 * Core Rights Invariant for Thoughts.Whatever:
 * 1. Material hosted directly by Thoughts.Whatever MUST have verified PUBLIC_DOMAIN or LICENSED rights.
 * 2. Material from Internet Archive or other open repositories defaults to RIGHTS_UNVERIFIED and EXTERNAL hosting.
 * 3. RIGHTS_UNVERIFIED and RESTRICTED resources must NEVER expose download or hosted media buttons.
 */

export interface RightsCapabilities {
  canReadOnline: boolean;
  canDownload: boolean;
  canListen: boolean;
  canViewOriginalSource: boolean;
  hasHostedFiles: boolean;
  downloadUrl?: string | null;
  readOnlineUrl?: string | null;
  audioUrl?: string | null;
  originalSourceUrl?: string | null;
  isRightsVerified: boolean;
  isHosted: boolean;
}

export function validateHostingRights(
  hostingMode: ReferenceHostingMode,
  rightsStatus: ReferenceRightsStatus,
) {
  if (
    hostingMode === "THOUGHTS_WHATEVER" &&
    rightsStatus !== "PUBLIC_DOMAIN" &&
    rightsStatus !== "LICENSED"
  ) {
    throw new Error(
      "Hosted assets require verified public-domain status or an applicable license. Resources with unverified, restricted, or external rights cannot host files directly.",
    );
  }
}

export function deriveCapabilities(params: {
  rightsStatus: ReferenceRightsStatus;
  hostingMode: ReferenceHostingMode;
  assets?: Array<{
    kind: ReferenceAssetKind;
    fileUrl: string;
    isDownloadable?: boolean;
    isOnlineReadable?: boolean;
    transcriptText?: string | null;
  }>;
  sourceUrl?: string | null;
  readerManifest?: any;
}): RightsCapabilities {
  const { rightsStatus, hostingMode, assets = [], sourceUrl, readerManifest } = params;

  const isRightsVerified =
    rightsStatus === "PUBLIC_DOMAIN" || rightsStatus === "LICENSED";
  const isHosted = hostingMode === "THOUGHTS_WHATEVER";

  const pdfAsset = assets.find((a) => a.kind === "PDF");
  const audioAsset = assets.find((a) => a.kind === "AUDIO");
  const transcriptAsset = assets.find((a) => a.kind === "TRANSCRIPT");

  const hasReaderPages = Boolean(
    readerManifest &&
    Array.isArray(readerManifest.pages) &&
    readerManifest.pages.length > 0,
  );

  const canDownload =
    isRightsVerified &&
    isHosted &&
    assets.some((a) => a.isDownloadable && a.fileUrl);

  const canReadOnline =
    isRightsVerified &&
    isHosted &&
    (hasReaderPages || Boolean(pdfAsset) || Boolean(transcriptAsset?.transcriptText));

  const canListen = isRightsVerified && isHosted && Boolean(audioAsset?.fileUrl);
  const canViewOriginalSource = Boolean(sourceUrl);

  return {
    canReadOnline,
    canDownload,
    canListen,
    canViewOriginalSource,
    hasHostedFiles: isHosted && (assets.length > 0 || hasReaderPages),
    downloadUrl: canDownload ? (pdfAsset?.fileUrl || assets[0]?.fileUrl) : null,
    readOnlineUrl: canReadOnline ? (pdfAsset?.fileUrl || null) : null,
    audioUrl: canListen ? (audioAsset?.fileUrl || null) : null,
    originalSourceUrl: sourceUrl || null,
    isRightsVerified,
    isHosted,
  };
}

export interface RightsBadgeMeta {
  labelEn: string;
  labelBn: string;
  variant: "public-domain" | "licensed" | "external" | "unverified" | "restricted";
  colorClass: string;
  descriptionEn: string;
  descriptionBn: string;
}

export function getRightsBadgeMeta(
  status: ReferenceRightsStatus,
): RightsBadgeMeta {
  switch (status) {
    case "PUBLIC_DOMAIN":
      return {
        labelEn: "Public Domain",
        labelBn: "পাবলিক ডোমেইন",
        variant: "public-domain",
        colorClass: "bg-emerald-950/60 text-emerald-400 border-emerald-800/60",
        descriptionEn:
          "Verified as free of known copyright restrictions under applicable laws. Free to read, listen, and archive.",
        descriptionBn:
          "প্রযোজ্য আইনের অধীনে কপিরাইট মুক্ত হিসেবে যাচাইকৃত। পাঠ, শ্রবণ ও গবেষণার জন্য উন্মুক্ত।",
      };
    case "LICENSED":
      return {
        labelEn: "Licensed",
        labelBn: "অনুমোদিত / লাইসেন্সপ্রাপ্ত",
        variant: "licensed",
        colorClass: "bg-sky-950/60 text-sky-400 border-sky-800/60",
        descriptionEn:
          "Hosted under an explicit license or permission granted by the rights holder.",
        descriptionBn:
          "স্বত্বাধিকারীর লিখিত অনুমতি বা উন্মুক্ত লাইসেন্সের অধীনে সংগৃহীত।",
      };
    case "EXTERNAL_SOURCE":
      return {
        labelEn: "External Source",
        labelBn: "বহিরাগত উৎস",
        variant: "external",
        colorClass: "bg-zinc-900/80 text-zinc-300 border-zinc-700/60",
        descriptionEn:
          "Cataloged for research. Thoughts.Whatever links directly to the legitimate institutional source.",
        descriptionBn:
          "গবেষণার সুবিধার্থে তালিকাভুক্ত। ডিজিটাল কপিটি মূল প্রাতিষ্ঠানিক সংগ্রহাগারে সংরক্ষিত।",
      };
    case "RIGHTS_UNVERIFIED":
      return {
        labelEn: "Rights Unverified",
        labelBn: "স্বত্ব অপরীক্ষিত",
        variant: "unverified",
        colorClass: "bg-amber-950/60 text-amber-400 border-amber-800/60",
        descriptionEn:
          "Copyright status has not been independently verified. Thoughts.Whatever does not host downloadable files.",
        descriptionBn:
          "স্বত্বের আইনি স্থিতি এখনও স্বতন্ত্রভাবে পরীক্ষিত নয়। কোনো সরাসরি ডাউনলোড কপি রাখা হয়নি।",
      };
    case "RESTRICTED":
      return {
        labelEn: "Restricted",
        labelBn: "সংরক্ষিত কপিরাইট",
        variant: "restricted",
        colorClass: "bg-rose-950/60 text-rose-400 border-rose-800/60",
        descriptionEn:
          "Protected by active copyright. Cataloged for bibliographic discovery only; no unauthorized copies hosted.",
        descriptionBn:
          "সক্রিয় কপিরাইটের আওতাভুক্ত। শুধুমাত্র গ্রন্থপঞ্জি তথ্যের জন্য তালিকাভুক্ত; ফাইল সংরক্ষিত নয়।",
      };
  }
}
