import { TranslatedContent } from "@/components/i18n/translated-content";
import React from "react";
import { ReferenceRightsContent } from "./reference-rights-content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rights & Provenance Policy | Reference Library",
  alternates: { canonical: "/reference/rights" },
  description:
    "Editorial and legal rights framework, public domain evaluation, and digital preservation principles for the Thoughts.Whatever Reference Library and Digital Archive.",
};

export default function ReferenceRightsPolicyPage() {
  return <TranslatedContent><ReferenceRightsContent /></TranslatedContent>;
}
