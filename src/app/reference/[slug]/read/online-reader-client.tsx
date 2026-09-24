"use client";

import React from "react";
import { NativeBookReader } from "@/components/reference/reader/native-book-reader";

interface OnlineReaderClientProps {
  workTitle: string;
  pdfUrl?: string | null;
  transcriptText?: string | null;
  sourceUrl?: string | null;
  sourceName?: string;
}

export function OnlineReaderClient({
  workTitle,
  pdfUrl,
  transcriptText,
  sourceUrl,
  sourceName = "Original Source",
}: OnlineReaderClientProps) {
  return (
    <NativeBookReader
      work={{
        id: "legacy",
        slug: "legacy-reader",
        titleBn: workTitle,
        language: "BENGALI",
      }}
      edition={{
        id: "legacy-edition",
        hostingMode: "THOUGHTS_WHATEVER",
        rightsStatus: "PUBLIC_DOMAIN",
      }}
      source={sourceUrl ? { sourceName, sourceUrl } : null}
      pages={[]}
      pdfUrl={pdfUrl}
      transcriptText={transcriptText}
      isRightsVerified={true}
      canDownload={Boolean(pdfUrl)}
      downloadUrl={pdfUrl}
    />
  );
}
