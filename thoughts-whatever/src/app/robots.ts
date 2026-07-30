import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/utils";

/**
 * Everything under /admin is behind a session gate, and /api returns JSON —
 * neither belongs in an index. /search and /bookmarks are disallowed here as
 * well as being noindex: they are reader-state pages with no stable content,
 * and crawling them just burns budget that should go to the writing.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/", "/api/", "/search", "/bookmarks", "/letter/unsubscribe"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
