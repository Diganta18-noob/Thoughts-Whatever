export const dynamic = "force-dynamic";

import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchClient } from "./search-client";

export const metadata: Metadata = {
  title: "খুঁজুন",
  description: "লেখক, বিষয় বা শিরোনাম ধরে খুঁজুন।",
  alternates: { canonical: "/search" },
  // A search results page has nothing to offer an index.
  robots: { index: false, follow: true },
};

export default function SearchPage() {
  return (
    // useSearchParams needs a Suspense boundary, or the whole route opts out
    // of static rendering.
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <SearchClient />
    </Suspense>
  );
}
