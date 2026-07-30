import type { Metadata } from "next";
import { BookmarksClient } from "./bookmarks-client";

export const metadata: Metadata = {
  title: "পরে পড়ব",
  description: "সংরক্ষিত লেখার তালিকা।",
  // The list lives in the reader's browser, so there is nothing here to crawl.
  robots: { index: false, follow: false },
};

export default function BookmarksPage() {
  return <BookmarksClient />;
}
