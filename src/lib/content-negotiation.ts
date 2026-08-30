/**
 * RFC 7231 & acceptmarkdown.com compliant HTTP content negotiation parser.
 */

export interface ParsedMediaType {
  type: string;
  subtype: string;
  q: number;
}

/**
 * Parse an HTTP Accept header string into an array of media types with their quality (q) values.
 */
export function parseAcceptHeader(header: string | null | undefined): ParsedMediaType[] {
  if (!header || !header.trim()) {
    return [{ type: "*", subtype: "*", q: 1.0 }];
  }

  const items = header.split(",");
  const parsed: ParsedMediaType[] = [];

  for (const item of items) {
    const parts = item.trim().split(";");
    if (!parts[0]) continue;

    const mediaRange = parts[0].trim().toLowerCase();
    const slashIdx = mediaRange.indexOf("/");
    if (slashIdx === -1) continue;

    const type = mediaRange.slice(0, slashIdx).trim();
    const subtype = mediaRange.slice(slashIdx + 1).trim();

    let q = 1.0;
    for (let i = 1; i < parts.length; i++) {
      const param = parts[i].trim();
      if (param.startsWith("q=")) {
        const val = parseFloat(param.slice(2));
        if (!isNaN(val) && val >= 0 && val <= 1) {
          q = val;
        }
      }
    }

    if (q > 0) {
      parsed.push({ type, subtype, q });
    }
  }

  // Sort by q descending
  parsed.sort((a, b) => b.q - a.q);
  return parsed;
}

export type NegotiatedType = "html" | "markdown" | "not_acceptable";

/**
 * Negotiate content type between text/html and text/markdown.
 * 
 * Rules:
 * - If client explicitly requests text/markdown with higher q than text/html -> "markdown"
 * - If client requests text/html with equal or higher q -> "html"
 * - If client includes wildcard (text/*, *\/*) -> "html" (default presentation for browsers)
 * - If client provides explicit Accept header that rejects both html and markdown and wildcards -> "not_acceptable"
 */
export function negotiateContentType(acceptHeader: string | null | undefined): NegotiatedType {
  if (!acceptHeader || !acceptHeader.trim()) {
    return "html";
  }

  const mediaTypes = parseAcceptHeader(acceptHeader);
  if (mediaTypes.length === 0) {
    return "not_acceptable";
  }

  let markdownQ = -1;
  let htmlQ = -1;
  let hasWildcard = false;

  for (const mt of mediaTypes) {
    if (mt.type === "text" && mt.subtype === "markdown") {
      if (markdownQ === -1) markdownQ = mt.q;
    } else if (
      (mt.type === "text" && (mt.subtype === "html" || mt.subtype === "plain")) ||
      (mt.type === "application" && mt.subtype === "xhtml+xml")
    ) {
      if (htmlQ === -1) htmlQ = mt.q;
    } else if (
      (mt.type === "*" && mt.subtype === "*") ||
      (mt.type === "text" && mt.subtype === "*")
    ) {
      hasWildcard = true;
      if (htmlQ === -1) htmlQ = mt.q;
    }
  }

  // If text/markdown is explicitly preferred over HTML
  if (markdownQ > 0 && markdownQ > htmlQ) {
    return "markdown";
  }

  // If HTML or wildcard was acceptable
  if (htmlQ > 0 || hasWildcard) {
    return "html";
  }

  // If text/markdown was matched (even if equal to html, but html was 0)
  if (markdownQ > 0) {
    return "markdown";
  }

  return "not_acceptable";
}

/**
 * Determines whether a given request path is a public canonical content route
 * that should participate in content negotiation.
 */
export function isContentNegotiablePath(pathname: string): boolean {
  // Exclude Next.js internals, static assets, and APIs
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/brand") ||
    pathname.startsWith("/ingest") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".avif") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".map") ||
    pathname.endsWith(".txt") ||
    pathname.endsWith(".xml") ||
    pathname.endsWith(".webmanifest")
  ) {
    return false;
  }

  return true;
}
